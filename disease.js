// 全局语言键：与导航栏保持一致
function dzIsEn() {
  try {
    if (window.cnI18n && window.cnI18n.language) return window.cnI18n.language === "en";
    const stored = localStorage.getItem("agritech_lang") || localStorage.getItem("lang") || "zh-CN";
    return String(stored).toLowerCase().startsWith("en");
  } catch (error) {
    return false;
  }
}

const diseaseDatabase = {
  Tomato___Bacterial_spot: {
    name: "Tomato Bacterial Spot",
    severity: "high",
    description:
      "Bacterial infection causing small, dark spots on leaves, stems, and fruit. Spreads rapidly in warm, humid conditions.",
    treatment:
      "Apply copper-based bactericides at first sign of disease. Improve air circulation, avoid overhead watering, remove infected plant debris, and consider disease-resistant varieties.",
  },
  Tomato___Early_blight: {
    name: "Tomato Early Blight",
    severity: "medium",
    description:
      "Fungal disease causing dark spots with concentric rings on older leaves. Can reduce yield significantly if left untreated.",
    treatment:
      "Apply fungicides containing chlorothalonil or copper. Remove affected lower leaves, ensure proper plant spacing, and mulch to prevent soil splash.",
  },
  Tomato___Late_blight: {
    name: "Tomato Late Blight",
    severity: "high",
    description:
      "Devastating fungal disease that can destroy entire plants quickly in humid conditions. The same pathogen that caused the Irish Potato Famine.",
    treatment:
      "Apply preventive fungicides (mancozeb, copper, or chlorothalonil). Remove infected plants immediately, ensure good drainage and air circulation, avoid overhead watering.",
  },
  Tomato___Leaf_Mold: {
    name: "Tomato Leaf Mold",
    severity: "medium",
    description:
      "Fungal disease causing yellow spots on upper leaf surface and fuzzy olive-green growth underneath. Common in greenhouse conditions.",
    treatment:
      "Improve ventilation and reduce humidity below 85%. Apply fungicides if necessary, avoid wetting leaves when watering, and ensure adequate plant spacing.",
  },
  Tomato___Septoria_leaf_spot: {
    name: "Tomato Septoria Leaf Spot",
    severity: "medium",
    description:
      "Fungal disease causing small circular spots with dark borders and light centers on leaves. Progresses from bottom to top of plant.",
    treatment:
      "Remove affected lower leaves immediately, apply fungicide sprays, mulch around plants to prevent soil splash, and avoid overhead watering.",
  },
  "Tomato___Spider_mites_Two-spotted_spider_mite": {
    name: "Two-Spotted Spider Mites",
    severity: "medium",
    description:
      "Tiny pests causing stippling, yellowing, and fine webbing on leaves. Thrive in hot, dry conditions.",
    treatment:
      "Increase humidity around plants, use predatory mites (biological control), apply miticides if severe, and regularly spray with water to dislodge mites.",
  },
  Tomato___Target_Spot: {
    name: "Tomato Target Spot",
    severity: "medium",
    description:
      "Fungal disease causing circular spots with concentric rings on leaves and fruit. Can cause significant defoliation.",
    treatment:
      "Apply fungicides containing chlorothalonil or mancozeb. Remove infected plant debris, ensure good air circulation, and avoid overhead irrigation.",
  },
  Tomato___Tomato_Yellow_Leaf_Curl_Virus: {
    name: "Tomato Yellow Leaf Curl Virus",
    severity: "high",
    description:
      "Viral disease spread by whiteflies causing yellowing, curling, and stunting of leaves. Can severely reduce fruit production.",
    treatment:
      "Control whitefly populations with insecticides or reflective mulches. Remove infected plants immediately. Use virus-resistant varieties when possible.",
  },
  Tomato___Tomato_mosaic_virus: {
    name: "Tomato Mosaic Virus",
    severity: "high",
    description:
      "Viral disease causing mottled yellow and green patterns on leaves, stunted growth, and reduced fruit quality.",
    treatment:
      "No cure available. Remove infected plants immediately. Disinfect tools with 10% bleach solution. Plant virus-resistant varieties and control aphid vectors.",
  },
  Tomato___healthy: {
    name: "Healthy Tomato Plant",
    severity: "low",
    description:
      "Plant appears healthy with no visible signs of disease or pest damage. Continue regular monitoring and preventive care.",
    treatment:
      "Maintain good cultural practices: proper watering, adequate spacing, regular fertilization, and routine plant inspection for early disease detection.",
  },
  Potato___Early_blight: {
    name: "Potato Early Blight",
    severity: "medium",
    description:
      "Fungal disease causing dark spots with concentric rings on leaves. Can reduce tuber quality and yield.",
    treatment:
      "Apply fungicides containing chlorothalonil or mancozeb. Remove infected foliage, ensure proper plant spacing, and avoid overhead irrigation.",
  },
  Potato___Late_blight: {
    name: "Potato Late Blight",
    severity: "high",
    description:
      "Devastating fungal disease that can destroy crops rapidly in cool, wet conditions. Affects both foliage and tubers.",
    treatment:
      "Apply preventive fungicides (copper or mancozeb). Destroy infected plants immediately. Ensure good drainage and avoid overhead watering.",
  },
  Potato___healthy: {
    name: "Healthy Potato Plant",
    severity: "low",
    description:
      "Plant shows no signs of disease. Continue monitoring and maintain good agricultural practices.",
    treatment:
      "Continue regular care including proper fertilization, hill soil around stems, monitor for Colorado potato beetle, and ensure adequate moisture.",
  },
  Corn___Cercospora_leaf_spot_Gray_leaf_spot: {
    name: "Corn Gray Leaf Spot",
    severity: "medium",
    description:
      "Fungal disease causing rectangular gray lesions on leaves. Can significantly reduce yield in susceptible varieties.",
    treatment:
      "Plant resistant varieties, rotate crops, apply fungicides if severe. Remove crop debris after harvest to reduce overwintering spores.",
  },
  Corn___Common_rust: {
    name: "Corn Common Rust",
    severity: "medium",
    description:
      "Fungal disease causing small, reddish-brown pustules on leaves. Most common in cool, humid weather.",
    treatment:
      "Plant resistant hybrids, apply fungicides if conditions favor disease development. Usually not economically damaging in most conditions.",
  },
  Corn___Northern_Leaf_Blight: {
    name: "Northern Corn Leaf Blight",
    severity: "medium",
    description:
      "Fungal disease causing cigar-shaped lesions on leaves. Can cause significant yield loss in susceptible hybrids.",
    treatment:
      "Use resistant hybrids, rotate crops with non-host plants, apply fungicides if disease pressure is high. Bury crop residue after harvest.",
  },
  Corn___healthy: {
    name: "Healthy Corn Plant",
    severity: "low",
    description:
      "Plant appears healthy with normal growth and no disease symptoms visible.",
    treatment:
      "Continue standard corn production practices: adequate fertilization, weed control, and monitoring for pests and diseases.",
  },
  Apple___Apple_scab: {
    name: "Apple Scab",
    severity: "medium",
    description:
      "Fungal disease causing dark, scabby lesions on leaves and fruit. Can cause premature leaf drop and unmarketable fruit.",
    treatment:
      "Apply fungicides during wet periods in spring. Rake and destroy fallen leaves. Prune for better air circulation. Plant scab-resistant varieties.",
  },
  Apple___Black_rot: {
    name: "Apple Black Rot",
    severity: "high",
    description:
      "Fungal disease causing brown leaf spots and black, mummified fruit. Can cause significant fruit loss.",
    treatment:
      "Remove mummified fruit and infected wood. Apply fungicides during bloom and fruit development. Improve air circulation through pruning.",
  },
  Apple___Cedar_apple_rust: {
    name: "Cedar Apple Rust",
    severity: "medium",
    description:
      "Fungal disease requiring both apple and cedar hosts. Causes yellow spots on leaves and orange lesions on fruit.",
    treatment:
      "Remove nearby cedar trees if possible. Apply fungicides in spring. Plant rust-resistant apple varieties. Remove infected leaves and fruit.",
  },
  Apple___healthy: {
    name: "Healthy Apple Tree",
    severity: "low",
    description:
      "Tree shows healthy foliage and normal growth patterns with no visible disease symptoms.",
    treatment:
      "Continue routine orchard management: proper pruning, fertilization, pest monitoring, and sanitation practices.",
  },
  Grape___Black_rot: {
    name: "Grape Black Rot",
    severity: "high",
    description:
      "Fungal disease causing brown leaf spots and shriveled, black fruit. Can destroy entire grape clusters.",
    treatment:
      "Apply fungicides from bloom through fruit development. Remove mummified berries and infected canes. Ensure good air circulation.",
  },
  "Grape___Esca_(Black_Measles)": {
    name: "Grape Esca (Black Measles)",
    severity: "high",
    description:
      "Fungal trunk disease causing leaf discoloration, berry spotting, and eventual vine decline or death.",
    treatment:
      "Remove infected wood during dormant season. Apply wound protectants after pruning. Consider trunk renewal in severely affected vines.",
  },
  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
    name: "Grape Leaf Blight",
    severity: "medium",
    description:
      "Fungal disease causing brown spots on leaves that may develop yellow halos. Can cause defoliation.",
    treatment:
      "Apply fungicides during wet periods. Remove infected leaves. Ensure proper vine spacing and canopy management for air circulation.",
  },
  Grape___healthy: {
    name: "Healthy Grape Vine",
    severity: "low",
    description:
      "Vine displays healthy foliage and normal fruit development with no disease symptoms.",
    treatment:
      "Maintain good vineyard practices: proper pruning, canopy management, balanced nutrition, and regular disease monitoring.",
  },
};

// 图片筛查统一走后端本地 PyTorch 模型；不再从 CDN 加载 MobileNet。
let plantCheckAvailable = false;

async function isPlantImage() {
  // 模型本身不包含“是否植物”的二分类，不能伪造 100% 植物判定。
  // 交由 38 类模型返回置信度，低置信度在结果中明确提示。
  return true;
}

/**
 * 调用本地 /api/disease/predict。
 * 注意：识别结果来自 PlantVillage 38 类模型，不等同于中国田间诊断。
 */
async function simulateAIAnalysis(imageFile) {
  const dataUrl = await readPreviewDataUrl(imageFile);
  const cropHint = document.getElementById('cropHint')?.value || '';
  const response = await fetch('/api/disease/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl, crop_type: cropHint || undefined }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status !== 'ok') {
    throw new Error(data.message || '识别服务暂不可用，请稍后再试。');
  }

  const prediction = data.prediction;
  const label = prediction.label || '';
  const severePattern = /(Late_blight|Yellow_Leaf_Curl_Virus|mosaic_virus|Haunglongbing|Black_rot|Esca)/i;
  const severity = prediction.severity || (prediction.is_healthy ? 'low' : severePattern.test(label) ? 'high' : 'medium');
  return {
    disease: label,
    confidence: Math.round(Number(prediction.confidence) * 100),
    info: {
      name: prediction.label_cn,
      severity,
      description: prediction.description || '模型未提供该类别说明。',
      treatment: prediction.treatment || '请咨询当地农技或植保部门。',
    },
    predictions: data.predictions || [],
    lowConfidence: Boolean(data.low_confidence),
    disclaimer: data.disclaimer || '',
    modelScope: data.model?.scope || '',
    source: 'local-pytorch',
  };
}

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const previewContainer = document.getElementById("previewContainer");
const loading = document.getElementById("loading");
const resultsDiv = document.getElementById("results");

let selectedFile = null;
let uploadInProgress = false;
let fileSelectionToken = 0;

// File upload handling
uploadArea.addEventListener("click", () => fileInput.click());

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  uploadArea.classList.add("drag-animation");

  setTimeout(() => {
    uploadArea.classList.remove("drag-animation");
  }, 600);

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileSelect(files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

/*function handleFileSelect(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file (JPG, PNG, WebP)");
    return;
  }

  selectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewContainer.innerHTML = `<img src="${e.target.result}" alt="Plant preview" class="preview-image">`;
    analyzeBtn.disabled = false;
    resultsDiv.innerHTML = "";
  };
  reader.readAsDataURL(file);
}*/

// Analysis function
analyzeBtn.addEventListener("click", async () => {
  if (uploadInProgress || !selectedFile) return;

  loading.style.display = "block";
  resultsDiv.innerHTML = "";
  document.getElementById("downloadPdfBtn").style.display = "none";

  analyzeBtn.disabled = true;

  try {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(selectedFile);
    await new Promise((resolve) => (img.onload = resolve));

    const validPlant = await isPlantImage(img);

    if(!validPlant) {
      loading.style.display = "none";
      analyzeBtn.disabled = false;
      resultsDiv.innerHTML = `
        <div class="result-card" style="border-left-color: #ffc107;">
          <div class="disease-name" style="color: #ffc107;">⚠️ Invalid Image</div>
          <div class="description">Please upload a valid plant image.</div>
        </div>`;
        document.getElementById("downloadPdfBtn").style.display = "none";
      return;
    }

    // Proceed if valid plant image
    const result = await simulateAIAnalysis(selectedFile);

    loading.style.display = "none";

    displayResults(result);
  } catch (error) {
    console.error("Analysis error:", error);
    loading.style.display = "none";
    resultsDiv.innerHTML = `
                    <div class="result-card" style="border-left-color: #dc3545;">
                        <div class="disease-name" style="color: #dc3545;">❌ Analysis Failed</div>
                        <div class="description">Unable to analyze the image. Please try again with a clearer image.</div>
                    </div>
                `;
          document.getElementById("downloadPdfBtn").style.display = "none";
      analyzeBtn.disabled = false;

  }

  analyzeBtn.disabled = false;
});

// === PREDICTION HISTORY & COMPARISON STATE ===
const HISTORY_STORAGE_KEY = "agritech_disease_prediction_history";
let currentPredictionRecord = null;
let currentPreviewDataUrl = null;

function getPredictionHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read history from localStorage:", e);
    return [];
  }
}

function savePredictionRecord(result, thumbnailDataUrl) {
  const history = getPredictionHistory();
  const crop = result.disease ? result.disease.split("___")[0].replace(/_/g, " ") : "Plant";
  const now = new Date();
  
  const record = {
    id: "pred_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    timestamp: now.getTime(),
    dateFormatted: now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    crop: crop,
    diseaseKey: result.disease,
    name: result.info.name,
    confidence: result.confidence,
    severity: result.info.severity,
    description: result.info.description,
    treatment: result.info.treatment,
    thumbnail: thumbnailDataUrl || "images/logo.png",
  };

  // Prepend to history, limit to 25 records
  history.unshift(record);
  if (history.length > 25) {
    history.pop();
  }

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn("Storage quota exceeded or error saving history:", e);
  }

  currentPredictionRecord = record;
  updateHistoryUI();
  return record;
}

function deleteHistoryItem(id) {
  let history = getPredictionHistory();
  history = history.filter((item) => item.id !== id);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn("Error updating history storage:", e);
  }
  updateHistoryUI();
  renderHistoryList();
}

function clearAllHistory() {
  if (confirm("Are you sure you want to clear all stored diagnosis history?")) {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    updateHistoryUI();
    renderHistoryList();
    closeModal("historyModal");
  }
}

function updateHistoryUI() {
  const history = getPredictionHistory();
  const badge = document.getElementById("historyCountBadge");
  if (badge) {
    badge.textContent = history.length;
  }
  const totalText = document.getElementById("historyTotalText");
  if (totalText) {
    totalText.textContent = `${history.length} scan${history.length === 1 ? "" : "s"} stored`;
  }
  
  const compareBtn = document.getElementById("compareBtn");
  if (compareBtn) {
    const hasPrevious = history.length >= 2;
    compareBtn.disabled = !hasPrevious;
    if (hasPrevious) {
      const prev = history[1];
      compareBtn.title = `Compare with previous diagnosis (${prev.crop} - ${prev.name})`;
    } else {
      compareBtn.title = "Compare will be available once you have more than 1 scan";
    }
  }
}

function openComparisonModal(specificPreviousId = null) {
  const history = getPredictionHistory();
  if (!currentPredictionRecord && history.length > 0) {
    currentPredictionRecord = history[0];
  }

  if (!currentPredictionRecord) {
    alert("Please run a plant disease diagnosis first to compare results.");
    return;
  }

  const previousCandidates = history.filter(
    (item) => item.id !== currentPredictionRecord.id
  );

  if (previousCandidates.length === 0) {
    alert("No previous scan found in history to compare with. Please upload another plant image to see side-by-side temporal changes.");
    return;
  }

  // Populate Select Dropdown
  const selectElem = document.getElementById("compareSelectPrevious");
  if (selectElem) {
    selectElem.innerHTML = "";

    previousCandidates.forEach((item, index) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = `${item.dateFormatted} — ${item.crop}: ${item.name} (${item.confidence}%)`;
      if (specificPreviousId && item.id === specificPreviousId) {
        opt.selected = true;
      } else if (!specificPreviousId && index === 0) {
        opt.selected = true;
      }
      selectElem.appendChild(opt);
    });

    const selectedPrevId = selectElem.value;
    const prevRecord = previousCandidates.find((item) => item.id === selectedPrevId) || previousCandidates[0];
    renderComparison(currentPredictionRecord, prevRecord);
  }

  openModal("comparisonModal");
}

function renderComparison(curr, prev) {
  if (!curr || !prev) return;

  const severityOrder = { low: 1, medium: 2, high: 3 };
  const currSevScore = severityOrder[curr.severity] || 1;
  const prevSevScore = severityOrder[prev.severity] || 1;

  let severityDiffClass = "diff-badge same";
  let severityDiffText = "● Unchanged";
  let severityRowClass = "";
  if (currSevScore < prevSevScore) {
    severityDiffClass = "diff-badge improved";
    severityDiffText = `▲ Improved (${prev.severity} → ${curr.severity})`;
    severityRowClass = "diff-highlight-improved";
  } else if (currSevScore > prevSevScore) {
    severityDiffClass = "diff-badge worsened";
    severityDiffText = `▼ Worsened (${prev.severity} → ${curr.severity})`;
    severityRowClass = "diff-highlight-worsened";
  }

  // Confidence difference
  const confDelta = Math.round(curr.confidence - prev.confidence);
  const confDeltaText = confDelta > 0 ? `+${confDelta}%` : `${confDelta}%`;
  const confDiffClass = confDelta > 0 ? "diff-badge improved" : confDelta < 0 ? "diff-badge changed" : "diff-badge same";

  // Disease match
  const diseaseMatch = curr.name === prev.name;
  const diseaseDiffClass = diseaseMatch ? "diff-badge same" : "diff-badge changed";
  const diseaseDiffText = diseaseMatch ? "✓ Same Condition" : "↔ Different Diagnosis";
  const diseaseRowClass = diseaseMatch ? "" : "diff-highlight-changed";

  // Crop match
  const cropMatch = curr.crop.toLowerCase() === prev.crop.toLowerCase();
  const cropDiffClass = cropMatch ? "diff-badge same" : "diff-badge changed";
  const cropDiffText = cropMatch ? "✓ Same Crop" : "↔ Different Crop";

  // Smart Summary banner
  const banner = document.getElementById("comparisonSummaryBanner");
  if (banner) {
    let bannerHtml = "";
    if (cropMatch && diseaseMatch) {
      if (currSevScore < prevSevScore) {
        banner.className = "comparison-summary-banner improved";
        bannerHtml = `<i class="fas fa-check-circle" style="font-size: 1.4rem;"></i>
          <div><strong>Positive Recovery:</strong> The ${curr.crop} plant shows reduced disease severity compared to the scan on ${prev.dateFormatted}. Continue prescribed treatments!</div>`;
      } else if (currSevScore > prevSevScore) {
        banner.className = "comparison-summary-banner worsened";
        bannerHtml = `<i class="fas fa-exclamation-triangle" style="font-size: 1.4rem;"></i>
          <div><strong>Attention Required:</strong> Disease severity has progressed from <u>${prev.severity.toUpperCase()}</u> to <u>${curr.severity.toUpperCase()}</u> since ${prev.dateFormatted}. Immediate intervention advised.</div>`;
      } else {
        banner.className = "comparison-summary-banner";
        bannerHtml = `<i class="fas fa-info-circle" style="font-size: 1.4rem;"></i>
          <div><strong>Consistent Status:</strong> Diagnosis confirmed as <strong>${curr.name}</strong> (${curr.confidence}% confidence) with stable severity level.</div>`;
      }
    } else if (cropMatch && !diseaseMatch) {
      banner.className = "comparison-summary-banner changed";
      bannerHtml = `<i class="fas fa-exchange-alt" style="font-size: 1.4rem;"></i>
        <div><strong>Diagnosis Transition on ${curr.crop}:</strong> Previous scan detected <em>${prev.name}</em>, whereas current scan identified <em>${curr.name}</em>. Review updated treatment protocol.</div>`;
    } else {
      banner.className = "comparison-summary-banner";
      bannerHtml = `<i class="fas fa-balance-scale" style="font-size: 1.4rem;"></i>
        <div><strong>Cross-Crop Comparison:</strong> Comparing <strong>${curr.crop}</strong> (${curr.name}) against previously analyzed <strong>${prev.crop}</strong> (${prev.name}).</div>`;
    }
    banner.innerHTML = bannerHtml;
  }

  // Populate Table Headers
  const prevHeader = document.getElementById("prevColHeader");
  if (prevHeader) {
    prevHeader.innerHTML = `<i class="fas fa-history"></i> Previous (${prev.dateFormatted})`;
  }
  const currHeader = document.getElementById("currColHeader");
  if (currHeader) {
    currHeader.innerHTML = `<i class="fas fa-camera"></i> Current (${curr.dateFormatted})`;
  }

  // Build Table Rows
  const tbody = document.getElementById("comparisonTableBody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td class="param-col"><i class="fas fa-image"></i> Leaf Photograph</td>
        <td class="prev-col">
          <img src="${prev.thumbnail}" alt="${prev.name}" class="comparison-thumb">
        </td>
        <td class="curr-col">
          <img src="${curr.thumbnail}" alt="${curr.name}" class="comparison-thumb">
        </td>
        <td class="diff-col"><span class="diff-badge same">Visual</span></td>
      </tr>
      <tr class="${cropMatch ? '' : 'diff-highlight-changed'}">
        <td class="param-col"><i class="fas fa-seedling"></i> Plant / Crop</td>
        <td class="prev-col"><strong>${prev.crop}</strong></td>
        <td class="curr-col"><strong>${curr.crop}</strong></td>
        <td class="diff-col"><span class="${cropDiffClass}">${cropDiffText}</span></td>
      </tr>
      <tr class="${diseaseRowClass}">
        <td class="param-col"><i class="fas fa-stethoscope"></i> Diagnosed Disease</td>
        <td class="prev-col"><strong style="color: var(--color-brand-dark);">${prev.name}</strong></td>
        <td class="curr-col"><strong style="color: var(--color-brand-dark);">${curr.name}</strong></td>
        <td class="diff-col"><span class="${diseaseDiffClass}">${diseaseDiffText}</span></td>
      </tr>
      <tr class="${severityRowClass}">
        <td class="param-col"><i class="fas fa-shield-virus"></i> Severity Level</td>
        <td class="prev-col">
          <span class="comparison-severity-tag ${prev.severity}">${prev.severity.toUpperCase()}</span>
        </td>
        <td class="curr-col">
          <span class="comparison-severity-tag ${curr.severity}">${curr.severity.toUpperCase()}</span>
        </td>
        <td class="diff-col"><span class="${severityDiffClass}">${severityDiffText}</span></td>
      </tr>
      <tr class="${confDelta !== 0 ? 'diff-highlight-changed' : ''}">
        <td class="param-col"><i class="fas fa-percentage"></i> AI Confidence</td>
        <td class="prev-col"><strong>${prev.confidence}%</strong></td>
        <td class="curr-col"><strong>${curr.confidence}%</strong></td>
        <td class="diff-col"><span class="${confDiffClass}">${confDelta > 0 ? '▲ ' : confDelta < 0 ? '▼ ' : ''}${confDeltaText}</span></td>
      </tr>
      <tr>
        <td class="param-col"><i class="fas fa-book-open"></i> Description & Symptoms</td>
        <td class="prev-col" style="font-size: 0.88rem; color: var(--text-gray);">${prev.description}</td>
        <td class="curr-col" style="font-size: 0.88rem; color: var(--text-gray);">${curr.description}</td>
        <td class="diff-col"><span class="diff-badge same">${prev.description === curr.description ? 'Identical' : 'Updated'}</span></td>
      </tr>
      <tr class="${prev.treatment !== curr.treatment ? 'diff-highlight-changed' : ''}">
        <td class="param-col"><i class="fas fa-prescription-bottle-alt"></i> Recommended Treatment</td>
        <td class="prev-col" style="font-size: 0.88rem;">${prev.treatment}</td>
        <td class="curr-col" style="font-size: 0.88rem;">${curr.treatment}</td>
        <td class="diff-col"><span class="diff-badge ${prev.treatment === curr.treatment ? 'same' : 'changed'}">${prev.treatment === curr.treatment ? 'Match' : 'Prescription'}</span></td>
      </tr>
    `;
  }
}

function renderHistoryList() {
  const history = getPredictionHistory();
  const container = document.getElementById("historyListContainer");
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-gray);">
        <i class="fas fa-folder-open" style="font-size: 2.5rem; color: var(--border); margin-bottom: 10px;"></i>
        <p>No diagnosis history saved yet. Scanned plants will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map((item) => `
    <div class="history-card">
      <div class="history-card-info">
        <img src="${item.thumbnail}" alt="${item.name}" style="width: 55px; height: 55px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border);">
        <div>
          <h4 style="margin: 0 0 3px 0; color: var(--color-brand-dark); font-size: 0.98rem;">${item.name}</h4>
          <div style="font-size: 0.8rem; color: var(--text-gray); display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <span><i class="far fa-calendar-alt"></i> ${item.dateFormatted}</span>
            <span><i class="fas fa-percentage"></i> ${item.confidence}%</span>
            <span class="comparison-severity-tag ${item.severity}" style="padding: 1px 6px; font-size: 0.72rem;">${item.severity.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <div class="history-card-actions">
        <button class="btn-sm-primary" onclick="openComparisonWithHistorical('${item.id}')" title="Compare this scan with current">
          <i class="fas fa-columns"></i> Compare
        </button>
        <button class="btn-icon" onclick="deleteHistoryItem('${item.id}')" title="Delete record">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function openComparisonWithHistorical(id) {
  closeModal("historyModal");
  openComparisonModal(id);
}

function openHistoryModal() {
  renderHistoryList();
  openModal("historyModal");
}

function displayResults(result) {
  const { disease, confidence, info } = result;

  const severityClass = info.severity;
  const severityEmoji = {
    low: "✅",
    medium: "⚠️",
    high: "🚨",
  };

  resultsDiv.innerHTML = `
    <div class="result-card">
        <div class="disease-name">${severityEmoji[severityClass]} ${info.name}</div>
        <div class="confidence">${dzIsEn() ? "Model confidence" : "模型置信度"}：${confidence}% ${result.lowConfidence ? (dzIsEn() ? "(low — treat with caution)" : '（偏低，请谨慎参考）') : ''}</div>
        <div class="severity ${severityClass}">
            ${dzIsEn() ? "Risk notice" : "风险提示"}：${dzIsEn()
              ? (severityClass === 'low' ? 'No obvious disease features' : severityClass === 'high' ? 'Ask your local plant-protection service to review as soon as possible' : 'Keep monitoring and re-check')
              : (severityClass === 'low' ? '未见明显病害特征' : severityClass === 'high' ? '建议尽快请当地植保部门复核' : '建议持续观察并复核')}
        </div>
        <div class="description">${info.description}</div>
        <div style="margin-top:10px;font-size:12px;color:var(--text-gray);line-height:1.6;">
          <strong>${dzIsEn() ? "Scope" : "适用范围"}：</strong>${result.modelScope || (dzIsEn() ? 'PlantVillage 38-class public dataset, not validated with Chinese field data.' : 'PlantVillage 38 类公开数据集，未使用中国田间数据验证。')}<br />
          ${result.disclaimer || ''}
        </div>
        <div class="treatment">
            <h4>🌿 ${dzIsEn() ? "General Agronomic Advice" : "通用农艺管理建议"}</h4>
            <p>${info.treatment}</p>
            <p style="font-size:12px;color:var(--text-gray);margin-top:8px;">${dzIsEn() ? "For any specific pesticide, verify the crops, target pests, label dose and pre-harvest interval registered in China; never apply chemicals based on an image result alone." : "具体药剂须核对在中国登记的作物、防治对象、标签剂量和安全间隔期，不得凭图片识别自行用药。"}</p>
        </div>
    </div>
  `;

  // Save prediction into history
  savePredictionRecord(result, currentPreviewDataUrl);

  // Show action buttons bar
  const actionsBar = document.getElementById("resultsActionsBar");
  if (actionsBar) {
    actionsBar.style.display = "flex";
  }
}

// Modal functionality
function openModal(modalId) {
  const elem = document.getElementById(modalId);
  if (elem) {
    elem.style.display = "block";
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const elem = document.getElementById(modalId);
  if (elem) {
    elem.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

// Add event listeners for modal close buttons
document.querySelectorAll(".close").forEach((closeBtn) => {
  closeBtn.addEventListener("click", (e) => {
    const modal = e.target.closest(".modal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  });
});

// Close modal when clicking outside
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  });
});

// Keyboard navigation for modals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal").forEach((modal) => {
      if (modal.style.display === "block") {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    });
  }
});

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌱 Plant Disease Detection System Initialized");
  console.log(
    "📊 Disease Database loaded with",
    Object.keys(diseaseDatabase).length,
    "diseases"
  );

  // 读取本地模型可用状态，模型自检失败时明确禁用，不能伪装识别成功。
  fetch('/api/ai/status', { headers: { Accept: 'application/json' } })
    .then((response) => response.ok ? response.json() : null)
    .then((status) => {
      const badge = document.getElementById('modelStatus');
      if (!badge || !status) return;
      const localReady = !!status.plant_disease_model?.available;
      const cloudReady = !!status.vision_model?.available;
      const button = document.getElementById('analyzeBtn');

      if (!localReady && !cloudReady) {
        badge.className = 'status-indicator status-warning';
        badge.style.color = '#92400e';
        badge.style.background = '#fffbeb';
        badge.innerHTML = '<span aria-hidden="true">⚠️</span> 识别服务未就绪（本地模型与云端模型均不可用），图片识别已禁用；不能替代田间诊断。';
        badge.title = status.plant_disease_model?.error || '识别服务不可用';
        if (button) {
          button.disabled = true;
          button.textContent = '识别服务未就绪 · 暂不可识别';
        }
        return;
      }

      badge.className = 'status-indicator status-success';
      badge.style.color = '';
      badge.style.background = '';
      if (localReady) {
        badge.title = '本地 PyTorch 模型已加载';
        badge.innerHTML = '<span aria-hidden="true">✅</span> 本地模型已就绪，请上传清晰叶片图片';
      } else {
        badge.title = `云端多模态：${status.vision_model.model}（${status.vision_model.endpoint}）`;
        badge.innerHTML = `<span aria-hidden="true">☁️</span> 云端多模态已就绪（${status.vision_model.model}），请上传清晰叶片图片`;
      }
    })
    .catch(() => {});

  const header = document.querySelector(".header");
  if (header) {
    header.style.opacity = "0";
    header.style.transform = "translateY(-20px)";
    setTimeout(() => {
      header.style.transition = "all 0.6s ease";
      header.style.opacity = "1";
      header.style.transform = "translateY(0)";
    }, 100);
  }
});

// Additional utility functions
function validateImage(file) {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 10 * 1024 * 1024; 

  if (!validTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload JPG, PNG, or WebP images only."
    );
  }

  if (file.size > maxSize) {
    throw new Error("File too large. Please upload images smaller than 10MB.");
  }

  return true;
}

function readPreviewDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error("Error loading image preview."));
    reader.readAsDataURL(file);
  });
}

// Enhanced file handling with validation
async function handleFileSelect(file) {
  const currentSelectionToken = ++fileSelectionToken;

  try {
    validateImage(file);
    uploadInProgress = true;
    selectedFile = null;
    analyzeBtn.disabled = true;

    previewContainer.innerHTML = '<div class="spinner"></div>';

    const previewDataUrl = await readPreviewDataUrl(file);

    if (currentSelectionToken !== fileSelectionToken) {
      return;
    }

    selectedFile = file;
    currentPreviewDataUrl = previewDataUrl;
    previewContainer.innerHTML = `<img src="${previewDataUrl}" alt="Plant preview" class="preview-image">`;
    resultsDiv.innerHTML = "";
    const actionsBar = document.getElementById("resultsActionsBar");
    if (actionsBar) actionsBar.style.display = "none";
    document.getElementById("downloadPdfBtn").style.display = "none";

    document.getElementById("modelStatus").innerHTML =
      "🔍 Image loaded - Ready for analysis";
    document.getElementById("modelStatus").className =
      "status-indicator status-warning";

    analyzeBtn.disabled = false;
  } catch (error) {
    if (currentSelectionToken !== fileSelectionToken) {
      return;
    }

    alert(error.message);
    previewContainer.innerHTML =
      '<div class="no-results">📷 Upload an image to get started</div>';
    selectedFile = null;
    currentPreviewDataUrl = null;
    analyzeBtn.disabled = true;
  } finally {
    if (currentSelectionToken === fileSelectionToken) {
      uploadInProgress = false;
    }
  }
}

// Add some sample data for demonstration
const sampleAnalysisResults = [
  { disease: "Tomato___Early_blight", confidence: 89 },
  { disease: "Potato___Late_blight", confidence: 94 },
  { disease: "Apple___Apple_scab", confidence: 87 },
  { disease: "Grape___Black_rot", confidence: 92 },
  { disease: "Corn___Northern_Leaf_Blight", confidence: 85 },
  { disease: "Tomato___healthy", confidence: 96 },
];

// Enhanced simulation function
function simulateAIAnalysis(imageFile) {
  return new Promise((resolve) => {
    const randomResult =
      sampleAnalysisResults[
        Math.floor(Math.random() * sampleAnalysisResults.length)
      ];
    const diseaseInfo = diseaseDatabase[randomResult.disease];

    setTimeout(() => {
      resolve({
        disease: randomResult.disease,
        confidence: randomResult.confidence + Math.floor(Math.random() * 6) - 3, 
        info: diseaseInfo,
      });
    }, 1500 + Math.random() * 1500);
  });
}
function downloadPredictionPDF() {
  const resultsBox = document.getElementById("results");
  if (!resultsBox || resultsBox.innerText.trim() === "") {
    alert("No result available to download!");
    return;
  }

  const now = new Date().toLocaleString();
  const originalContent = document.body.innerHTML;

  document.body.innerHTML = `
    <div style="font-family: Arial; padding: 20px;">
      <h2>AgriTech - Prediction Result</h2>
      <p><b>Date/Time:</b> ${now}</p>
      <hr/>
      ${resultsBox.innerHTML}
    </div>
  `;

  window.print();
  document.body.innerHTML = originalContent;
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize history UI count badge
  updateHistoryUI();

  const pdfBtn = document.getElementById("downloadPdfBtn");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", downloadPredictionPDF);
  }

  const compareBtn = document.getElementById("compareBtn");
  if (compareBtn) {
    compareBtn.addEventListener("click", () => openComparisonModal());
  }

  const historyBtn = document.getElementById("historyBtn");
  if (historyBtn) {
    historyBtn.addEventListener("click", () => openHistoryModal());
  }

  const compareSelect = document.getElementById("compareSelectPrevious");
  if (compareSelect) {
    compareSelect.addEventListener("change", (e) => {
      const selectedId = e.target.value;
      const history = getPredictionHistory();
      const prevRecord = history.find((item) => item.id === selectedId);
      if (currentPredictionRecord && prevRecord) {
        renderComparison(currentPredictionRecord, prevRecord);
      }
    });
  }

  const clearHistoryBtn = document.getElementById("clearAllHistoryBtn");
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", clearAllHistory);
  }

  const openHistoryFromCompare = document.getElementById("openHistoryFromCompareBtn");
  if (openHistoryFromCompare) {
    openHistoryFromCompare.addEventListener("click", () => {
      closeModal("comparisonModal");
      openHistoryModal();
    });
  }

  const printCompareBtn = document.getElementById("printComparisonBtn");
  if (printCompareBtn) {
    printCompareBtn.addEventListener("click", () => window.print());
  }
});

