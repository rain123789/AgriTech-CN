// AgriTech Assistant - Chat Interface & AI Vision Integration
const USE_AI_FALLBACK = true;
const CHAT_HISTORY_STORAGE_KEY = 'agritech_chat_history';

// Local storage prediction helper
function savePrediction(input, output) {
  try {
    const history = JSON.parse(localStorage.getItem("predictions")) || [];
    const newEntry = { input, output, timestamp: new Date().toLocaleString() };
    history.unshift(newEntry);
    localStorage.setItem("predictions", JSON.stringify(history.slice(0, 5)));
  } catch (err) {
    console.warn("Prediction saving failed:", err);
  }
}

// Rule-based fallback responses (offline mode)
const RULE_BASED_FALLBACKS = {
  soil: "土壤健康直接影响产量。建议增施充分腐熟的有机肥、避免过量用药，并定期进行土壤检测。",
  crop: "作物管理包括选择适合当地季节的品种、适时播种，以及持续监测病虫害。",
  crops: "合理轮作、平衡施肥、按需灌溉和定期巡查是作物管理的基础。",
  water: "节水灌溉可优先采用滴灌或喷灌，并根据土壤墒情和作物需水关键期安排。",
  irrigation: "灌溉应根据作物生育期、土壤含水率和天气预报综合决定，不宜只按固定天数。",
  fertilizer: "施肥应先测土配方，避免盲目偏施氮肥。叶面肥只能作为补充，不能替代土壤施肥。",
  disease: "发现病叶应第一时间拍照记录、清除病残体，并请当地农技或植保部门复核。具体药剂必须核对登记标签。",
  pest: "病虫害防控优先采用农业防治、生物防治和物理诱控，达到防治指标后再在专业指导下用药。"
};

const DEFAULT_FALLBACK_MESSAGE =
  "当前为离线规则模式。建议优先做好土壤健康、按需灌溉、平衡施肥和定期田间巡查；具体病虫害问题请联系当地农技部门复核。";

const FALLBACK_MESSAGES = [
  "我暂时没有完全理解这个问题。可以补充作物、生育期、地区和具体症状后再问。",
  "本地规则库没有覆盖这个问题的可靠答案。你可以询问作物推荐、灌溉、病虫害或施肥。",
  "请把问题再具体一些，例如所在省份、种植季节、土壤条件和已经采取的措施。"
];

const MIN_TYPING_DELAY_MS = 600;
const MAX_TYPING_DELAY_MS = 2000;

document.addEventListener('DOMContentLoaded', () => {
  // Update copyright year dynamically
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const chatContainer = document.getElementById('chat-container');
  const chatWindow = document.getElementById('chat-window');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-button');
  const clearChatBtn = document.getElementById('clear-chat-btn');

  // Photo upload elements
  const imageInput = document.getElementById('image-input');
  const uploadPhotoBtn = document.getElementById('upload-photo-btn');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreviewImg = document.getElementById('image-preview');
  const previewFilename = document.getElementById('preview-filename');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const dropOverlay = document.getElementById('drop-overlay');

  // Lightbox modal elements
  const lightboxModal = document.getElementById('image-lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');

  // Active attached image state
  let currentImageDataUrl = null;
  let currentImageBase64 = null;
  let currentImageName = "";

  // Initialize JSON-based chatbot if available
  let jsonChatbot = null;
  if (typeof JSONChatbot === 'function') {
    jsonChatbot = new JSONChatbot();
  }

  let chatHistory = [];

  const updateAiMode = (mode, model, imageAnalysis, verified = false) => {
    const badge = document.getElementById('cn-ai-mode');
    if (!badge) return;
    const online = mode === 'online';
    badge.textContent = online ? (verified ? `DeepSeek 在线 · ${model || ''}` : 'DeepSeek 已配置') : mode === 'offline-fallback' ? '在线失败 · 本地规则' : '离线规则模式';
    badge.style.background = online ? 'rgba(34,197,94,.16)' : 'rgba(245,158,11,.14)';
    badge.title = online ? '回答由 DeepSeek 兼容接口生成' : '未调用大模型，回答来自本地规则库';
    if (imageAnalysis && imageAnalysis.status && imageAnalysis.status !== 'ok') {
      badge.title += `；图片模型：${imageAnalysis.message || '不可用'}`;
    }
  };

  fetch('/api/ai/status', { headers: { Accept: 'application/json' } })
    .then((response) => response.ok ? response.json() : null)
    .then((status) => {
      if (!status) return;
      updateAiMode(status.mode, status.model);
      if (!status.plant_disease_model?.available) {
        const badge = document.getElementById('cn-ai-mode');
        if (badge) badge.title += `；病害模型：${status.plant_disease_model?.error || '未就绪'}`;
      }
    })
    .catch(() => updateAiMode('offline'));

  const persistChatHistory = () => {
    try {
      // Keep up to 30 recent messages in localStorage
      const historyToSave = chatHistory.slice(-30);
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(historyToSave));
    } catch (error) {
      console.warn('Unable to persist chat history:', error);
    }
  };

  const loadChatHistory = () => {
    try {
      const rawHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      const parsedHistory = rawHistory ? JSON.parse(rawHistory) : [];
      return Array.isArray(parsedHistory)
        ? parsedHistory.filter((entry) => entry && (typeof entry.messageContent === 'string' || entry.imageSrc) && (entry.sender === 'user' || entry.sender === 'bot'))
        : [];
    } catch (error) {
      console.warn('Unable to load chat history:', error);
      return [];
    }
  };

  const saveMessageToHistory = (messageContent, sender, time, imageSrc = null) => {
    chatHistory.push({
      messageContent,
      sender,
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageSrc: imageSrc || null
    });
    persistChatHistory();
  };

  const renderSavedHistory = () => {
    if (!chatHistory.length) return false;

    const welcomeMessage = chatWindow.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    chatHistory.forEach(({ messageContent, sender, time, imageSrc }) => {
      displayMessage(messageContent, sender, time, false, imageSrc);
    });

    return true;
  };

  const clearChatHistory = () => {
    chatHistory = [];
    persistChatHistory();
    chatWindow.innerHTML = `
      <div class="welcome-message">
        <h3><i class="fas fa-leaf"></i> 欢迎使用 AI 农业助手</h3>
        <p>我可以回答常见作物管理问题。未配置大模型时会明确使用本地规则库，不会把关键词匹配冒充模型诊断。</p>
        <div class="suggestions">
          <div class="suggestion">这个平台可以做什么？</div>
          <div class="suggestion">如何使用作物种植推荐？</div>
          <div class="suggestion">当前季节适合种什么？</div>
          <div class="suggestion">有哪些有机防控方法？</div>
          <div class="suggestion">如何做好节水灌溉？</div>
          <div class="suggestion">如何改善土壤健康？</div>
          <div class="suggestion">如何使用病害识别？</div>
          <div class="suggestion">有哪些惠农政策？</div>
        </div>
      </div>
    `;
  };

  // HTML escaping function to prevent XSS
  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Format message text (support markdown links, bold, italics, code)
  function format(txt) {
    if (!txt) return '';
    return txt
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#22c55e;text-decoration:underline;">$1</a>');
  }

  // Lightbox controls
  const openLightbox = (imageSrc, captionText) => {
    if (!lightboxModal || !lightboxImg) return;
    lightboxImg.src = imageSrc;
    if (lightboxCaption) {
      lightboxCaption.textContent = captionText || "Crop diagnosis photo";
    }
    lightboxModal.style.display = 'flex';
    lightboxModal.setAttribute('aria-hidden', 'false');
  };

  const closeLightbox = () => {
    if (!lightboxModal) return;
    lightboxModal.style.display = 'none';
    lightboxModal.setAttribute('aria-hidden', 'true');
    if (lightboxImg) lightboxImg.src = '';
  };

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal && lightboxModal.style.display === 'flex') {
      closeLightbox();
    }
  });

  // Secure message rendering with optional image thumbnail
  function displayMessage(messageContent, sender, timeOverride, shouldPersist = true, imageSrc = null) {
    const welcomeMessage = chatWindow.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;

    const time = timeOverride || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const name = sender === 'user' ? '你' : 'AI 农业助手';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';

    const icon = document.createElement('i');
    icon.className = `fas fa-${sender === 'user' ? 'user' : 'robot'}`;
    headerDiv.appendChild(icon);
    headerDiv.appendChild(document.createTextNode(` ${name}`));

    messageElement.appendChild(headerDiv);

    // If an image is associated with this message, render preview thumbnail
    if (imageSrc) {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'message-image-container';

      const img = document.createElement('img');
      img.src = imageSrc;
      img.alt = '上传的作物照片';
      img.className = 'message-image';
      img.addEventListener('click', () => openLightbox(imageSrc, messageContent || "上传的作物照片"));

      const zoomBadge = document.createElement('span');
      zoomBadge.className = 'image-zoom-badge';
      zoomBadge.innerHTML = '<i class="fas fa-search-plus"></i> View';

      imgContainer.appendChild(img);
      imgContainer.appendChild(zoomBadge);
      messageElement.appendChild(imgContainer);
    }

    if (messageContent) {
      const textDiv = document.createElement('div');
      textDiv.className = 'message-text';
      textDiv.innerHTML = format(escapeHtml(messageContent));
      messageElement.appendChild(textDiv);
    }

    const timeDiv = document.createElement('div');
    timeDiv.className = 'timestamp';
    timeDiv.textContent = time;
    messageElement.appendChild(timeDiv);

    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    if (shouldPersist && !timeOverride) {
      saveMessageToHistory(messageContent, sender, time, imageSrc);
    }
  }

  // Handle image selection & preview
  const handleImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择有效的图片文件（PNG、JPEG 或 WebP）。');
      return;
    }

    // Limit image size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('图片超过 10 MB，请压缩后重试。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageDataUrl = e.target.result;
      currentImageBase64 = e.target.result.split(',')[1];
      currentImageName = file.name || "crop_photo.jpg";

      if (imagePreviewImg) {
        imagePreviewImg.src = currentImageDataUrl;
      }
      if (previewFilename) {
        const sizeKb = Math.round(file.size / 1024);
        previewFilename.innerHTML = `<i class="fas fa-image"></i> ${escapeHtml(currentImageName)} <small>(${sizeKb} KB)</small>`;
      }
      if (imagePreviewContainer) {
        imagePreviewContainer.style.display = 'flex';
      }
      chatInput.focus();
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    currentImageDataUrl = null;
    currentImageBase64 = null;
    currentImageName = "";
    if (imageInput) imageInput.value = '';
    if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    if (imagePreviewImg) imagePreviewImg.src = '';
  };

  // Attach event listeners for image upload button and input
  if (uploadPhotoBtn && imageInput) {
    uploadPhotoBtn.addEventListener('click', () => {
      imageInput.click();
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleImageFile(file);
    });
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', clearImage);
  }

  // Drag and Drop Handling on Chat Container
  if (chatContainer) {
    let dragCounter = 0;

    chatContainer.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      chatContainer.classList.add('drag-active');
    });

    chatContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    chatContainer.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        chatContainer.classList.remove('drag-active');
      }
    });

    chatContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      chatContainer.classList.remove('drag-active');

      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        const file = dt.files[0];
        if (file.type.startsWith('image/')) {
          handleImageFile(file);
        } else {
          alert('Please drop an image file (PNG, JPG, WEBP).');
        }
      }
    });
  }

  // Clipboard Paste Support (Ctrl+V)
  document.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData)?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageFile(file);
          break;
        }
      }
    }
  });

  // Suggestion pill clicks
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('suggestion')) {
      chatInput.value = e.target.textContent;
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getRandomFallbackMessage = () => {
    const randomIndex = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
    return FALLBACK_MESSAGES[randomIndex] || DEFAULT_FALLBACK_MESSAGE;
  };

  const getRuleBasedFallback = (input) => {
    const lowerInput = (input || '').toLowerCase();
    for (const keyword in RULE_BASED_FALLBACKS) {
      if (lowerInput.includes(keyword)) {
        return RULE_BASED_FALLBACKS[keyword];
      }
    }
    return getRandomFallbackMessage();
  };

  const resolveLocalResponse = async (input, hasImage = false) => {
    if (hasImage) {
      return "🌾 **已收到作物照片**\n\n图片已上传。若后端 AI 服务在线（DeepSeek 兼容接口），会结合图片给出更完整的诊断与处理建议；离线时只做通用提示。\n\n🔍 **初步自查要点**\n- **叶斑 / 早疫病**：摘除病叶病果，避免叶面长时间结露。\n- **白粉病 / 锈病**：发病初期按登记标签剂量用药，并注意安全间隔期。\n- **虫害**：翻看叶背，重点查蚜虫、蓟马、白粉虱。\n\n👉 **可用工具**：[作物病害识别](ai_disease.html)";
    }

    if (jsonChatbot) {
      try {
        const details = await jsonChatbot.getResponseDetails(input);
        if (details && details.response) {
          return details.response;
        }
      } catch (error) {
        console.warn('Local response matching failed:', error);
      }
    }
    return getRuleBasedFallback(input);
  };

  const computeTypingDelay = (userInput, botReply, hasImage) => {
    const inputLength = (userInput || '').length;
    const replyLength = (botReply || '').length;
    const base = hasImage ? 900 : 600;
    const dynamic = Math.min(800, Math.floor((inputLength + replyLength) * 1.8));
    return Math.max(MIN_TYPING_DELAY_MS, Math.min(MAX_TYPING_DELAY_MS, base + dynamic));
  };

  const showTyping = (labelText) => {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = `<div class="typing-text">${escapeHtml(labelText || 'AI 农业助手正在输入')}</div><span></span><span></span><span></span>`;
    chatWindow.appendChild(typing);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return typing;
  };

  const setTypingText = (typingElement, text) => {
    if (!typingElement) return;
    const textElement = typingElement.querySelector('.typing-text');
    if (textElement) {
      textElement.textContent = text;
    }
  };

  const toggleInput = (disable) => {
    if (sendBtn) sendBtn.disabled = disable;
    if (chatInput) chatInput.disabled = disable;
    if (uploadPhotoBtn) uploadPhotoBtn.disabled = disable;
    if (!disable && chatInput) chatInput.focus();
  };

  // Chat Form Submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = chatInput.value.trim();
    const attachedImage = currentImageDataUrl;
    const attachedImageBase64 = currentImageBase64;

    // Must have either text or image
    if (!input && !attachedImageBase64) return;

    if (input.length > 1000) {
      alert('消息过长，请控制在 1000 字以内。');
      return;
    }

    // Render user message with attached image preview
    const userDisplayCaption = input || (attachedImage ? "已上传作物图片，申请初步筛查" : "");
    displayMessage(userDisplayCaption, 'user', undefined, true, attachedImage);

    // Reset input fields and clear preview
    chatInput.value = '';
    chatInput.style.height = 'auto';
    clearImage();

    const hasImage = Boolean(attachedImageBase64);
    const typing = showTyping(hasImage ? 'AI 农业助手正在分析作物图片…' : 'AI 农业助手正在输入…');
    toggleInput(true);
    const startedAt = Date.now();

    try {
      let reply = "";
      let aiNotice = "";

      if (USE_AI_FALLBACK) {
        setTypingText(typing, hasImage ? '正在运行本地病害筛查…' : '正在整理农业知识库回答…');

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: input || "Please identify this crop and diagnose any disease, pest, or deficiency shown in this image, and provide recommendations.",
              image: attachedImageBase64 || null
            })
          });

          if (res.ok) {
            const data = await res.json();
            reply = data.reply || "";
            aiNotice = data.notice || "";
            updateAiMode(data.mode, data.model, data.image_analysis, true);
            if (reply) {
              savePrediction(input || "作物图片初步筛查", reply);
            }
          }
        } catch (fetchErr) {
          console.info("Backend /api/chat not reachable, using offline assistant:", fetchErr.message);
        }
      }

      if (!reply) {
        reply = await resolveLocalResponse(input, hasImage);
      }

      setTypingText(typing, '正在生成最终回答…');
      const typingDelay = computeTypingDelay(input, reply, hasImage);
      const elapsed = Date.now() - startedAt;
      if (elapsed < typingDelay) {
        await delay(typingDelay - elapsed);
      }

      if (aiNotice) reply += `\n\n> ${aiNotice}`;
      displayMessage(reply || DEFAULT_FALLBACK_MESSAGE, 'bot');

    } catch (error) {
      console.error('Chatbot error:', error);
      const fallbackReply = await resolveLocalResponse(input, hasImage);
      displayMessage(fallbackReply, 'bot');
    } finally {
      if (typing) typing.remove();
      toggleInput(false);
    }
  });

  // Auto expand textarea on input
  chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
  });

  // Enter to send, Shift+Enter for new line
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', clearChatHistory);
  }

  // Load chat history or show welcome message
  chatHistory = loadChatHistory();
  setTimeout(() => {
    if (!renderSavedHistory()) {
      displayMessage(
        "你好，我是 **AI 农业助手**。你可以咨询水稻、小麦、玉米、番茄等作物管理问题，也可以**上传作物照片**进行本地模型初步筛查。未配置大模型时会明确标注为离线规则回答。",
        'bot',
        undefined,
        false
      );
    }
  }, 400);

  chatInput.focus();
});
