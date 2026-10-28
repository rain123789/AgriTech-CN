/**
 * AgriTech Hyperlocal Voice Assistant & Voice Input Module
 * - Multilingual Speech-to-Text & Text-to-Speech (Online Gemini 2.5 Flash + Offline Local Fallback)
 * - Multimodal Camera / Image Disease Diagnosis Integration
 * - Floating PWA Voice Assistant Widget (#agri-voice-assistant)
 * - Offline Fallback Agronomy Knowledge Base & Speech Synthesis
 * - Form Voice-to-Text Enhancement
 */

// -----------------------------------------------------------------------------
// 0. LOCAL COPY (component follows the site language set by scripts/i18n.js)
// -----------------------------------------------------------------------------
const VOICE_TEXT = {
  zh: {
    floatingLabel: '语音农事助手',
    assistantTitle: '🌾 AI 农业语音助手',
    online: '在线模式（DeepSeek 兼容接口）',
    offline: '离线模式（本地规则库）',
    langLabel: '语音语言：',
    cropLabel: '作物：',
    cropContext: '作物：',
    statusIdle: '点击麦克风，说出您的农事问题',
    photoAttached: '已附加叶片照片，可用于病害识别',
    photoAlt: '已附加作物叶片照片',
    placeholder: '输入或语音说出农事问题…',
    tapToSpeak: '点击开始说话',
    snapPhoto: '拍照或上传叶片照片',
    submit: '提交问题',
    close: '关闭助手',
    recent: '最近咨询',
    emptyHistory: '暂无咨询记录，点击麦克风开始提问',
    listening: '正在聆听，请说出您的农事问题 🌾',
    listeningShort: '正在聆听…',
    tapMicHint: '点击麦克风说话，或在下方输入问题',
    analyzing: '正在生成农事建议…',
    loading: '正在生成农事建议，请稍候…',
    ready: '建议已生成，可播放语音或阅读 🎧',
    replay: '重播语音',
    playing: '正在播放…',
    speaking: '正在朗读…',
    clear: '清除',
    offlineTag: '离线模式回答',
    severity: '严重程度：',
    symptoms: '症状：',
    plantCondition: '植物状态',
    photoQuery: '作物照片识别',
    alertNoMic: '当前浏览器不支持语音识别，请改用文字输入。',
    alertEmpty: '请先说话或输入问题，也可以附加一张叶片照片。',
    captured: '已识别：',
    noSpeech: '未听到语音，请重新点击麦克风说话。',
    micDenied: '麦克风权限被拒绝，请在浏览器中允许访问。',
    networkBusy: '网络不稳定，已切换为离线回答。',
    unsupported: '当前浏览器不支持语音输入',
    voiceNote: '语音输入提示：',
    stopListening: '正在聆听，点击停止',
    retrySpeech: '识别出错，点击重试',
    clickToSpeak: '点击说话',
    sevHigh: '高',
    sevMedium: '中',
    sevLow: '低'
  },
  en: {
    floatingLabel: 'Voice Farming Assistant',
    assistantTitle: '🌾 AI Agricultural Voice Assistant',
    online: 'Online (DeepSeek-compatible endpoint)',
    offline: 'Offline (local rule base)',
    langLabel: 'Voice language:',
    cropLabel: 'Crop:',
    cropContext: 'Crop: ',
    statusIdle: 'Tap the microphone and ask your farming question',
    photoAttached: 'Leaf photo attached for disease AI',
    photoAlt: 'Attached crop leaf photo',
    placeholder: 'Type or speak your farming question…',
    tapToSpeak: 'Tap to speak',
    snapPhoto: 'Snap or upload a leaf photo',
    submit: 'Submit question',
    close: 'Close assistant',
    recent: 'Recent consultations',
    emptyHistory: 'No recent questions. Tap the microphone to start.',
    listening: 'Listening… ask your farming question 🌾',
    listeningShort: 'Listening…',
    tapMicHint: 'Tap the microphone or type your question below',
    analyzing: 'Generating farm advisory…',
    loading: 'Generating farm advisory, please wait…',
    ready: 'Advisory ready — listen or read below 🎧',
    replay: 'Replay voice note',
    playing: 'Playing audio…',
    speaking: 'Speaking…',
    clear: 'Clear',
    offlineTag: 'Offline mode reply',
    severity: 'Severity: ',
    symptoms: 'Symptoms: ',
    plantCondition: 'Plant condition',
    photoQuery: 'Crop photo diagnosis',
    alertNoMic: 'Speech recognition is not available in this browser. Please type your question.',
    alertEmpty: 'Please speak or type a question, or attach a leaf photo.',
    captured: 'Captured: ',
    noSpeech: 'No speech detected. Tap the microphone and try again.',
    micDenied: 'Microphone access denied. Please allow it in your browser.',
    networkBusy: 'Network unstable. Switched to the offline answer.',
    unsupported: 'Voice input is not supported in this browser',
    voiceNote: 'Voice input: ',
    stopListening: 'Listening… tap to stop',
    retrySpeech: 'Recognition failed — tap to retry',
    clickToSpeak: 'Tap to speak',
    sevHigh: 'High',
    sevMedium: 'Medium',
    sevLow: 'Low'
  }
};

function voiceUiLang() {
  try {
    if (window.cnI18n && window.cnI18n.language) {
      return window.cnI18n.language === 'en' ? 'en' : 'zh';
    }
  } catch (e) {}
  const stored = String(localStorage.getItem('agritech_lang') || localStorage.getItem('lang') || 'zh-CN').toLowerCase();
  return stored.startsWith('en') ? 'en' : 'zh';
}

function vt(key) {
  const dict = VOICE_TEXT[voiceUiLang()] || VOICE_TEXT.zh;
  return dict[key] !== undefined ? dict[key] : VOICE_TEXT.zh[key] || key;
}

const VOICE_RECOGNITION_LANG = { zh: 'zh-CN', en: 'en-US' };

const VOICE_CROPS = [
  { value: 'Tomato', zh: '番茄', en: 'Tomato' },
  { value: 'Wheat', zh: '小麦', en: 'Wheat' },
  { value: 'Rice', zh: '水稻', en: 'Rice / Paddy' },
  { value: 'Cotton', zh: '棉花', en: 'Cotton' },
  { value: 'Maize', zh: '玉米', en: 'Maize' },
  { value: 'Sugarcane', zh: '甘蔗', en: 'Sugarcane' },
  { value: 'Potato', zh: '马铃薯', en: 'Potato' },
  { value: 'Soybean', zh: '大豆', en: 'Soybean' },
  { value: 'Onion', zh: '洋葱', en: 'Onion' }
];

// -----------------------------------------------------------------------------
// 1. OFFLINE AGRONOMY KNOWLEDGE BASE (Multi-language local fallback)
// -----------------------------------------------------------------------------
const OFFLINE_AGRI_KB = [
  {
    tags: ["tomato", "blight", "black spot", "番茄", "西红柿", "早疫病", "叶斑", "褐斑", "टमाटर", "झुलसा", "करपा", "తెగులు"],
    title: "Tomato Blight & Leaf Spot Management",
    hi: "टमाटर में झुलसा (Blight) का उपाय:\n• 🌿 जैविक उपचार: 5 मिली नीम का तेल प्रति लीटर पानी में मिलाकर 7 दिन के अंतराल पर छिड़कें।\n• 🧪 रासायनिक: कॉपर ऑक्सीक्लोराइड (2.5 ग्राम/लीटर) या मैंकोजेब का छिड़काव करें।\n• 🛡️ रोकथाम: संक्रमित पत्तियां तोड़कर नष्ट करें और शाम को पानी देने से बचें।",
    en: "Tomato Blight Management:\n• 🌿 Organic: Spray Neem Oil (5ml/L water) or Trichoderma viride every 7 days.\n• 🧪 Chemical: Spray Copper Oxychloride (2.5g/L) or Mancozeb.\n• 🛡️ Prevention: Remove infected lower foliage and avoid sprinkler wetting of leaves.",
    zh: "番茄早疫病与叶斑病防治：\n• 🌿 绿色防控：及时摘除病叶病果，每 7～10 天喷施一次枯草芽孢杆菌或木霉菌制剂。\n• 🧪 药剂防治：发病初期选用代森锰锌或苯醚甲环唑，按标签剂量叶面喷雾。\n• 🛡️ 预防：避免傍晚大水漫灌，保持通风、缩短叶面结露时间。",
    mr: "टोमॅटो करपा (Blight) नियंत्रण:\n• 🌿 सेंद्रिय: ५ मिली निंबोळी तेल प्रति लिटर पाण्यात मिसळून फवारा.\n• 🧪 रासायनिक: कॉपर ऑक्सिक्लोराईड (२.५ ग्रॅम/लिटर) फवारा.\n• 🛡️ खबरदारी: रोपांच्या पानांवर पाणी साचू देऊ नका.",
    te: "టమోటా ఆకుమచ్చ & తెగులు నివారణ:\n• 🌿 సేంద్రీయ: వేప నూనె (5ml/లీ) 7 రోజుల వ్యవధిలో పిచికారీ చేయండి.\n• 🧪 రసాయన: కాపర్ ఆక్సిక్లోరైడ్ (2.5 గ్రా/లీ) వాడండి.\n• 🛡️ నివారణ: సోకిన ఆకులను తీసివేయండి.",
    ta: "தக்காளி இலைக்கருகல் நோய் மேலாண்மை:\n• 🌿 இயற்கை: வேப்பெண்ணெய் (5மி.லி/லிட்டர்) தெளிக்கவும்.\n• 🧪 ரசாயனம்: காப்பர் ஆக்ஸிகுளோரைடு (2.5 கிராம்/லிட்டர்) தெளிக்கவும்.\n• 🛡️ தடுப்பு: பாதிக்கப்பட்ட இலைகளை அகற்றவும்."
  },
  {
    tags: ["fertilizer", "npk", "urea", "dap", "施肥", "肥料", "氮肥", "复合肥", "养分", "खाद", "उर्वरक", "खत", "ఎరువు", "உரம்"],
    title: "Balanced Fertilizer & Soil Nutrition",
    hi: "संतुलित उर्वरक प्रबंधन सलाह:\n• 🌾 बेसल डोज: बुवाई के समय DAP या NPK 19:19:19 और 5 टन सड़ी गोबर खाद डालें।\n• 🌱 यूरिया: यूरिया को हमेशा 2-3 खुराकों में सिंचाई के तुरंत बाद दें।\n• 🍂 सूक्ष्म पोषक: फूल और फल आते समय जिंक सल्फेट और बोरॉन का पर्णीय छिड़काव करें।",
    en: "Balanced Fertilizer Advisory:\n• 🌾 Basal Dose: Apply DAP or NPK 19:19:19 at sowing with well-decomposed FYM.\n• 🌱 Urea: Split Urea into 2-3 top dressings after light irrigation.\n• 🍂 Micronutrients: Foliar spray of Zinc Sulfate & Boron during flowering.",
    zh: "平衡施肥与土壤养分管理：\n• 🌾 基肥：整地时施用腐熟有机肥，配合复合肥（如 15-15-15）作底肥。\n• 🌱 追肥：氮肥分 2～3 次随水追施，避免一次过量造成烧苗与养分流失。\n• 🍂 中微量元素：开花坐果期叶面补喷硼、锌，提高坐果率。",
    mr: "संतुलित खत व्यवस्थापन:\n• 🌾 पेरणीवेळी DAP किंवा NPK 19:19:19 आणि शेणखत टाका.\n• 🌱 युरिया २ ते ३ हप्त्यांत विभागून द्या.\n• 🍂 फुलधारणेच्या वेळी सूक्ष्म अन्नद्रव्यांची फवारणी करा.",
    te: "సమతుల్య ఎరువుల యాజమాన్యం:\n• 🌾 విత్తే సమయంలో DAP లేదా NPK 19:19:19 వేయండి.\n• 🌱 యూరియాను విడతల వారీగా తడి ఆరిన తర్వాత మాత్రమే చల్లండి.\n• 🍂 పూత సమయంలో జింక్, బోరాన్ పిచికారీ చేయండి.",
    ta: "சீரான உர மேலாண்மை:\n• 🌾 விதைப்பின் போது DAP அல்லது NPK 19:19:19 மற்றும் தொழு உரம் இடவும்.\n• 🌱 யூரியாவை 2-3 தவணைகளாக பிரித்து இடவும்."
  },
  {
    tags: ["pm kisan", "scheme", "subsidy", "补贴", "惠农", "政策", "农业保险", "योजना", "पीएम किसान", "ਸਕੀਮ", "పథకం", "திட்டம்"],
    title: "Government Schemes & PM-KISAN",
    hi: "सरकारी कृषि योजनाएं व सहायता:\n• 💰 PM-KISAN: पात्र किसानों को सालाना ₹6,000 (3 किश्तों में) मिलते हैं। e-KYC अवश्य पूरी रखें।\n• 🛡️ PMFBY: प्रधानमंत्री फसल बीमा योजना में प्रतिकूल मौसम से फसल नुकसान पर क्लेम 72 घंटे में दर्ज करें।\n• 📞 किसान कॉल सेंटर टोल-फ्री: 1800-180-1551 पर संपर्क करें।",
    en: "Government Agricultural Schemes:\n• 💰 PM-KISAN: ₹6,000/year direct transfer for registered farmers. Ensure e-KYC is active.\n• 🛡️ PMFBY: Pradhan Mantri Fasal Bima Yojana covers crop loss from drought/flood (Report in 72 hrs).\n• 📞 Kisan Call Center Helpline: 1800-180-1551 (Toll-Free).",
    zh: "惠农政策与补贴查询：\n• 💰 耕地地力保护补贴：按承包耕地面积发放，具体标准以县级农业农村部门公布为准。\n• 🛡️ 政策性农业保险：覆盖暴雨、洪涝、干旱、病虫害等，受灾后及时报案并保留现场照片。\n• 📞 咨询渠道：当地农业农村局、乡镇农技站，或 12316 三农服务热线。",
    mr: "शासकीय शेतकरी योजना:\n• 💰 पीएम किसान: वार्षिक ₹६,००० थेट बँक खात्यात. e-KYC पूर्ण ठेवा.\n• 🛡️ पीक विमा: नुकसान झाल्यास ७२ तासांत तक्रार नोंदवा.\n• 📞 किसान कॉल सेंटर: १८००-१८०-१५५१",
    te: "ప్రభుత్వ వ్యవసాయ పథకాలు:\n• 💰 పీఎం కిసాన్: అర్హులైన రైతులకు ఏడాదికి ₹6,000 అందుతాయి.\n• 🛡️ ప్రధానమంత్రి ఫసల్ బీమా యోజన కింద పంట నష్టం నమోదు చేసుకోండి.\n• 📞 కిసాన్ కాల్ సెంటర్: 1800-180-1551",
    ta: "அரசு மானிய திட்டங்கள்:\n• 💰 பி.எம் கிசான்: வருடத்திற்கு ₹6,000 நிதி உதவி.\n• 🛡️ பயிர் காப்பீட்டுத் திட்டம் மூலம் இழப்பீடு பெறலாம்.\n• 📞 உழவர் உதவி எண்: 1800-180-1551"
  },
  {
    tags: ["pest", "insect", "aphid", "caterpillar", "虫害", "害虫", "蚜虫", "红蜘蛛", "कीट", "मावा", "इल्ली", "పురుగు", "பூச்சி"],
    title: "Organic Pest & Insect Control",
    hi: "जैविक कीट नियंत्रण उपाय:\n• 🍃 नीम अर्क: 5% नीम बीज अर्क या 10,000 PPM नीम तेल का छिड़काव रस चूसक कीटों को रोकता है।\n• 🟡 फेरोमोन व येलो स्टिकी ट्रैप: प्रति एकड़ 5-6 ट्रैप लगाकर कीटों की निगरानी करें।\n• 🧪 गंभीर प्रकोप: अनुशंसित कीटनाशक जैसे इमिडाक्लोप्रिड या क्लोरेंट्रानिलिप्रोल का लेबल अनुसार प्रयोग करें।",
    en: "Organic & Integrated Pest Management:\n• 🍃 Neem Solution: 5ml Neem Oil/L or 5% NSKE controls sucking pests (whiteflies, aphids).\n• 🟡 Traps: Install 5-6 Yellow Sticky & Pheromone traps per acre for early interception.\n• 🧪 Severe Infestation: Use target-specific bio-pesticides or recommended spray.",
    zh: "绿色防控与虫害治理：\n• 🍃 生物防治：释放瓢虫、赤眼蜂等天敌，或使用印楝素、苦参碱等植物源药剂。\n• 🟡 物理诱杀：每亩悬挂 5～6 张黄色粘虫板，配合性诱剂监测虫口密度。\n• 🧪 化学防治：虫口达标后再用药，优先选低毒低残留药剂并遵守安全间隔期。",
    mr: "सेंद्रिय कीड नियंत्रण:\n• 🍃 निंबोळी अर्क: रसशोषक किडींसाठी ५% निंबोळी अर्काची फवारणी करा.\n• 🟡 चिकट सापळे: एकरी ५ पिवळे व निळे चिकट सापळे लावा.\n• 🧪 गरज भासल्यास शिफारशीत कीटकनाशक वापरा.",
    te: "సేంద్రీయ పురుగుల నివారణ:\n• 🍃 వేప నూనె: రసం పీల్చే పురుగుల నివారణకు వేప నూనె వాడండి.\n• 🟡 పసుపు జిగురు బోర్డులు ఎకరానికి 6 ఏర్పాటు చేయండి.",
    ta: "இயற்கை பூச்சி கட்டுப்பாடு:\n• 🍃 வேப்பெண்ணெய் கரைசல் சிறந்த பூச்சி விரட்டியாகும்.\n• 🟡 மஞ்சள் ஒட்டும் பொறிகளை வயலில் அமைக்கவும்."
  },
  {
    tags: ["wheat", "rust", "小麦", "锈病", "条锈", "गेहूं", "రస్ట్", "கோதுமை"],
    title: "Wheat Crop Care & Rust Prevention",
    hi: "गेहूं फसल देखभाल और रतुआ (Rust) नियंत्रण:\n• 🌾 पीला/भूरा रतुआ लक्षण: पत्तियों पर पीले-भूरे रंग के पाउडर जैसे धब्बे।\n• 🧪 उपचार: प्रोपिकोनाजोल 25% EC (1 मिली/लीटर) पानी में घोलकर तुरंत छिड़काव करें।\n• 💧 सिंचाई: पहली सिंचाई बुवाई के 21 दिन बाद (CRI स्टेज) पर अवश्य दें।",
    en: "Wheat Care & Rust Control:\n• 🌾 Rust Symptoms: Yellow or brown powdery pustules on foliage.\n• 🧪 Treatment: Spray Propiconazole 25% EC @ 1ml/L at earliest symptom onset.\n• 💧 Irrigation: Critical first irrigation at Crown Root Initiation (CRI) stage (21 DAS).",
    zh: "小麦锈病防治与田间管理：\n• 🌾 症状识别：叶片出现黄色至褐色的粉疱状孢子堆，手摸有铁锈色粉末。\n• 🧪 药剂防治：发病初期喷施三唑酮或戊唑醇，7～10 天后再补喷一次。\n• 💧 水肥管理：返青拔节期保证第一水，避免偏施氮肥造成群体过密。",
    mr: "गहू पीक व्यवस्थापन:\n• 🌾 तांबेरा रोग: पानांवर पिवळसर-तपकिरी ठिपके.\n• 🧪 उपाय: प्रोपिकोनाझोल १ मिली/लिटर पाण्यात फवारा.\n• 💧 पहिली पाणी पाळी पेरणीनंतर २१ दिवसांनी द्या.",
    te: "గోధుమ పంట సంరక్షణ:\n• 🌾 తుప్పు తెగులు నివారణకు ప్రొపికోనజోల్ 1ml/L పిచिकారీ చేయండి.\n• 💧 21వ రోజున మొదటి తడి తప్పనిసరిగా ఇవ్వండి."
  },
  {
    tags: ["rice", "paddy", "blast", "水稻", "稻瘟", "稻田", "धान", "चावल", "వరి", "நெல்"],
    title: "Rice / Paddy Blast & Water Management",
    hi: "धान (Paddy) ब्लास्ट रोग व पोषण:\n• 🌾 ब्लास्ट लक्षण: पत्तियों पर आंख के आकार के भूरे धब्बे।\n• 🧪 उपचार: ट्राइसाइक्लाजोल 75% WP (0.6 ग्राम/लीटर) का छिड़काव करें।\n• 💧 जल प्रबंधन: कल्ले फूटते समय और बाली निकलते समय खेत में 2-3 सेमी पानी बनाए रखें।",
    en: "Paddy Blast & Water Management:\n• 🌾 Blast Symptoms: Spindle/eye-shaped lesions with gray centers.\n• 🧪 Treatment: Spray Tricyclazole 75% WP (0.6g/L) or Isoprothiolane.\n• 💧 Water: Maintain 2-3 cm shallow water layer during tillering and panicle emergence.",
    zh: "水稻稻瘟病与水分管理：\n• 🌾 症状识别：叶片出现梭形病斑，中央灰白、边缘褐色。\n• 🧪 药剂防治：破口期选用三环唑或稻瘟灵，按标签剂量喷雾预防。\n• 💧 水浆管理：分蘖期浅水勤灌，够苗后适时晒田，抽穗期保持浅水层。",
    mr: "भात पिकावरील करपा व पाणी व्यवस्थापन:\n• 🌾 करपा रोग: पानांवर डोळ्याच्या आकाराचे ठिपके.\n• 🧪 उपाय: ट्रायसायक्लॅझोल ०.६ ग्रॅम/लिटर फवारा.\n• 💧 फुटवे फुटताना शेतात पाणी साठवून ठेवा.",
    te: "వరి అగ్గితెగులు నివారణ:\n• 🌾 ట్రైసైక్లాజోల్ 75% WP (0.6 గ్రా/లీ) పిచికారీ చేయండి.\n• 💧 పిలకలు వేసే దశలో నీటి నిల్వ ఉంచండి."
  }
];

// -----------------------------------------------------------------------------
// 2. VOICE INPUT MANAGER (Inline Form Inputs)
// -----------------------------------------------------------------------------
class VoiceInputManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.currentInput = null;
    this.supportedLanguages = {

      'en-IN': 'English (India)',
      'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
      'gu-IN': 'Gujarati (ગુજરાતી)',
      'bn-IN': 'Bengali (বাংলা)',
      'ml-IN': 'Malayalam (മലയാളം)'
    };
    this.currentLanguage = localStorage.getItem('agritech_voice_lang') || 'zh-CN';
    this.initializeRecognition();
  }

  initializeRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Web Speech Recognition not supported in this browser');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateButtonState(this.currentInput, 'listening');
      this.showFeedback(`${vt('listeningShort')} 🎙️`, 'info');
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;

      if (this.currentInput) {
        const currentValue = this.currentInput.value.trim();
        this.currentInput.value = currentValue ? `${currentValue} ${transcript}` : transcript;
        this.currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.currentInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      this.showFeedback(`${vt('captured')}"${transcript}" (${Math.round(confidence * 100)}%)`, 'success');
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      this.updateButtonState(this.currentInput, 'error');
      let msg = vt('voiceNote');
      switch (event.error) {
        case 'no-speech': msg += vt('noSpeech'); break;
        case 'not-allowed': msg += vt('micDenied'); break;
        case 'network': msg += vt('networkBusy'); break;
        default: msg += event.error;
      }
      this.showFeedback(msg, 'error');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateButtonState(this.currentInput, 'ready');
    };
    return true;
  }

  setLanguage(langCode) {
    if (this.supportedLanguages[langCode]) {
      this.currentLanguage = langCode;
      if (this.recognition) {
        this.recognition.lang = langCode;
      }
      localStorage.setItem('agritech_voice_lang', langCode);
    }
  }

  startListening(inputElement) {
    if (!this.recognition) {
      this.showFeedback(vt('unsupported'), 'error');
      return;
    }
    if (this.isListening) {
      this.stopListening();
      return;
    }
    this.currentInput = inputElement;
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch (e) {}
    }
  }

  updateButtonState(inputElement, state) {
    if (!inputElement) return;
    const button = inputElement.parentElement?.querySelector('.voice-btn');
    if (!button) return;
    button.classList.remove('listening', 'error', 'ready');
    button.classList.add(state);
    const icon = button.querySelector('i');
    if (icon) {
      if (state === 'listening') {
        icon.className = 'fas fa-microphone-slash';
        button.title = vt('stopListening');
      } else if (state === 'error') {
        icon.className = 'fas fa-exclamation-circle';
        button.title = vt('retrySpeech');
        setTimeout(() => {
          icon.className = 'fas fa-microphone';
          button.title = vt('clickToSpeak');
          button.classList.remove('error');
        }, 3000);
      } else {
        icon.className = 'fas fa-microphone';
        button.title = vt('clickToSpeak');
      }
    }
  }

  refreshButtonTitles() {
    document.querySelectorAll('.voice-btn').forEach((button) => {
      if (button.classList.contains('listening')) return;
      const input = button.parentElement?.querySelector('input, textarea');
      if (input) this.updateButtonState(input, 'ready');
    });
  }

  showFeedback(message, type = 'info') {
    let feedback = document.getElementById('voice-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.id = 'voice-feedback';
      feedback.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        max-width: 320px;
        padding: 12px 18px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.18);
        z-index: 100000;
        font-size: 13.5px;
        font-family: inherit;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(feedback);
    }

    const colors = {
      info: { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1' },
      success: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' }
    };
    const c = colors[type] || colors.info;
    feedback.style.backgroundColor = c.bg;
    feedback.style.borderLeft = `5px solid ${c.border}`;
    feedback.style.color = c.text;
    feedback.innerHTML = `<strong>${type === 'success' ? '✓' : type === 'error' ? '!' : 'ℹ'}</strong> <span>${message}</span>`;

    clearTimeout(this._feedbackTimer);
    this._feedbackTimer = setTimeout(() => {
      if (feedback && feedback.parentNode) {
        feedback.remove();
      }
    }, 4000);
  }

  addVoiceButton(inputElement) {
    if (!this.recognition || inputElement.parentElement?.querySelector('.voice-btn')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'voice-input-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';

    inputElement.parentNode.insertBefore(wrapper, inputElement);
    wrapper.appendChild(inputElement);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'voice-btn ready';
    button.title = vt('clickToSpeak');
    button.innerHTML = '<i class="fas fa-microphone"></i>';
    button.style.cssText = `
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      border-radius: 50%;
      width: 34px;
      height: 34px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(16,185,129,0.3);
      transition: all 0.25s ease;
      z-index: 10;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.startListening(inputElement);
    });

    wrapper.appendChild(button);
    const pad = parseInt(window.getComputedStyle(inputElement).paddingRight || '10') + 40;
    inputElement.style.paddingRight = `${pad}px`;
  }

  initializePageVoiceInputs(selector = 'input[type="text"], input[type="search"], textarea') {
    document.querySelectorAll(selector).forEach(input => {
      if (input.hasAttribute('data-no-voice') || input.parentElement?.classList.contains('voice-input-wrapper') || input.closest('#agri-voice-assistant-modal')) {
        return;
      }
      if (input.offsetParent !== null) {
        this.addVoiceButton(input);
      }
    });
  }
}

// -----------------------------------------------------------------------------
// 3. AGRIBOT HYPERLOCAL VOICE ASSISTANT (Floating PWA & Offline Engine)
// -----------------------------------------------------------------------------
class AgriVoiceAssistant {
  constructor() {
    this.isOpen = false;
    this.isRecording = false;
    this.recognition = null;
    this.currentAudio = null;
    this.selectedImageBase64 = null;
    this.selectedCrop = 'Tomato';
    const savedLang = localStorage.getItem('agritech_bot_lang');
    this.currentLang = savedLang === 'zh' || savedLang === 'en' ? savedLang : voiceUiLang();
    this.lastResponse = null;
    this.aiConfigured = null;
    this.offlineMode = !navigator.onLine;

    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
    window.addEventListener('languageChanged', () => {
      if (!localStorage.getItem('agritech_bot_lang')) this.currentLang = voiceUiLang();
      this.applyLanguage();
    });

    this.initSpeechEngine();
    this.renderAssistantDOM();
    this.loadHistory();
    this.syncAiStatus();
  }

  handleNetworkChange(isOnline) {
    this.offlineMode = !isOnline;
    this.updateNetworkBadge();
  }

  updateNetworkBadge() {
    const badge = document.getElementById('agri-bot-network-badge');
    if (!badge) return;
    const online = navigator.onLine && this.aiConfigured !== false;
    badge.className = `network-badge ${online ? 'online' : 'offline'}`;
    badge.innerHTML = `<span class="pulse-dot ${online ? '' : 'offline'}"></span> ${online ? vt('online') : vt('offline')}`;
  }

  // Re-apply copy when the site language changes
  applyLanguage() {
    const root = document.getElementById('agri-voice-assistant-container');
    if (!root) return;
    root.querySelectorAll('[data-voice-i18n]').forEach((el) => {
      el.textContent = vt(el.dataset.voiceI18n);
    });
    root.querySelectorAll('[data-voice-i18n-title]').forEach((el) => {
      el.setAttribute('title', vt(el.dataset.voiceI18nTitle));
    });
    const textInput = document.getElementById('agri-voice-text-input');
    if (textInput) textInput.placeholder = vt('placeholder');
    const imgPreview = document.getElementById('agri-voice-img-preview');
    if (imgPreview) imgPreview.alt = vt('photoAlt');
    const langSelect = document.getElementById('agri-voice-lang-select');
    if (langSelect) langSelect.value = this.currentLang;
    this.renderCropOptions();
    this.updateNetworkBadge();
    const statusText = document.getElementById('agri-voice-status-text');
    if (statusText) statusText.textContent = this.isRecording ? vt('listeningShort') : vt('statusIdle');
    if (this.lastResponse) {
      this.renderResponseUI(this.lastResponse);
    } else {
      this.loadHistory();
    }
    if (window.voiceInputManager) window.voiceInputManager.refreshButtonTitles();
  }

  renderCropOptions() {
    const cropSelect = document.getElementById('agri-voice-crop-select');
    if (!cropSelect) return;
    const selected = cropSelect.value || this.selectedCrop;
    const lang = voiceUiLang();
    cropSelect.innerHTML = VOICE_CROPS.map((crop) =>
      `<option value="${crop.value}">${crop[lang]}</option>`
    ).join('');
    cropSelect.value = selected;
  }

  initSpeechEngine() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('SpeechRecognition not supported in browser');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = VOICE_RECOGNITION_LANG[this.currentLang];

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.setRecordingUI(true);
      const statusText = document.getElementById('agri-voice-status-text');
      if (statusText) statusText.innerText = vt('listening');
    };

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
      const inputField = document.getElementById('agri-voice-text-input');
      if (inputField) inputField.value = transcript;

      if (event.results[0].isFinal) {
        this.submitQuery(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Voice assistant recognition error:', event.error);
      this.isRecording = false;
      this.setRecordingUI(false);
      const statusText = document.getElementById('agri-voice-status-text');
      if (statusText) statusText.innerText = vt('tapMicHint');
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      this.setRecordingUI(false);
    };
  }

  setRecordingUI(active) {
    const micBtn = document.getElementById('agri-voice-mic-main');
    const waveEl = document.getElementById('agri-voice-wave');
    if (micBtn) {
      if (active) {
        micBtn.classList.add('recording');
        micBtn.innerHTML = '<i class="fas fa-stop"></i>';
      } else {
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      }
    }
    if (waveEl) {
      waveEl.style.display = active ? 'flex' : 'none';
    }
  }

  toggleRecording() {
    if (!this.recognition) {
      alert(vt('alertNoMic'));
      return;
    }
    if (this.isRecording) {
      this.recognition.stop();
    } else {
      this.recognition.lang = VOICE_RECOGNITION_LANG[this.currentLang];
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition start retry:', e);
      }
    }
  }

  // Multimodal Image Attachment
  handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImageBase64 = e.target.result;
      const previewCont = document.getElementById('agri-voice-img-preview-cont');
      const previewImg = document.getElementById('agri-voice-img-preview');
      if (previewImg && previewCont) {
        previewImg.src = this.selectedImageBase64;
        previewCont.style.display = 'flex';
      }
    };
    reader.readAsDataURL(file);
  }

  removeAttachedImage() {
    this.selectedImageBase64 = null;
    const previewCont = document.getElementById('agri-voice-img-preview-cont');
    const inputEl = document.getElementById('agri-voice-photo-input');
    if (previewCont) previewCont.style.display = 'none';
    if (inputEl) inputEl.value = '';
  }

  // Match query against offline agronomy knowledge base
  getOfflineAnswer(queryText) {
    const q = (queryText || '').toLowerCase();
    for (const item of OFFLINE_AGRI_KB) {
      if (item.tags.some(t => q.includes(t.toLowerCase()))) {
        const text = item[this.currentLang] || item.en;
        return {
          title: item.title,
          text: text,
          offline: true
        };
      }
    }
    // Generic offline fallback
    const defaults = {
      zh: "🌾 离线农事建议：\n• 保持土壤含水量在田间持水量的 50%～60%。\n• 发现虫害或叶斑初期，可喷施稀释印楝素等植物源药剂。\n• 联网后可获取更完整的诊断建议（三农服务热线：12316）。",
      hi: "🌾 ऑफलाइन कृषि मित्र सलाह:\n• मिट्टी में 50-60% नमी बनाए रखें।\n• कीट या फफूंद दिखने पर 5 मिली नीम तेल प्रति लीटर पानी का छिड़काव करें।\n• नेटवर्क मिलने पर पुनः ऑनलाइन सलाह प्राप्त करें। (किसान हेल्पलाइन: 1800-180-1551)",
      en: "🌾 Offline AgriBot Advisory:\n• Maintain 50-60% field moisture capacity.\n• Spray 5ml Neem Oil/L water at early signs of sucking pests or leaf spots.\n• Connect to internet for live Gemini diagnosis. (Kisan Helpline: 1800-180-1551)",
      mr: "🌾 ऑफलाइन शेतकरी सल्ला:\n• जमिनीत योग्य ओलावा राखा.\n• कीड प्रतिबंधासाठी ५ मिली निंबोळी तेल प्रति लिटर फवारा.\n• शेतकरी हेल्पलाइन: १८००-१८०-१५५१",
      te: "🌾 ఆఫ్‌లైన్ రైతు సలహా:\n• నేలలో తగినంత తేమ ఉండేలా చూడండి.\n• పురుగుల నివారణకు వేప నూనె (5ml/L) పిచికారీ చేయండి."
    };
    return {
      title: "Offline Agronomy Guidance",
      text: defaults[this.currentLang] || defaults.en,
      offline: true
    };
  }

  // Local Offline Speech Synthesis (TTS)
  speakOffline(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean markdown/symbols
    const clean = text.replace(/[\*\_#•\n]+/g, ' ').replace(/[🌿🧪🍃🛡️🌾💰📝🔍🍂🌱]/g, '').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(clean);

    // Map language code
    utterance.lang = VOICE_RECOGNITION_LANG[this.currentLang] || 'zh-CN';
    utterance.rate = 0.95;

    const btn = document.getElementById('agri-voice-play-tts-btn');
    if (btn) btn.innerHTML = `<i class="fas fa-volume-up"></i> ${vt('speaking')}`;

    utterance.onend = () => {
      if (btn) btn.innerHTML = `<i class="fas fa-play"></i> ${vt('replay')}`;
    };
    utterance.onerror = () => {
      if (btn) btn.innerHTML = `<i class="fas fa-play"></i> ${vt('replay')}`;
    };

    window.speechSynthesis.speak(utterance);
  }

  // Play server synthesized MP3 or fallback to SpeechSynthesis
  playAudioResponse(audioInfo, fallbackText) {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    const playBtn = document.getElementById('agri-voice-play-tts-btn');

    if (audioInfo && audioInfo.audio_url) {
      this.currentAudio = new Audio(audioInfo.audio_url);
      if (playBtn) playBtn.innerHTML = `<i class="fas fa-volume-up"></i> ${vt('playing')}`;

      this.currentAudio.play().catch(() => {
        // Autoplay policy fallback -> use SpeechSynthesis
        this.speakOffline(fallbackText);
      });

      this.currentAudio.onended = () => {
        if (playBtn) playBtn.innerHTML = `<i class="fas fa-play"></i> ${vt('replay')}`;
      };
    } else if (audioInfo && audioInfo.audio_base64) {
      this.currentAudio = new Audio(`data:audio/mp3;base64,${audioInfo.audio_base64}`);
      if (playBtn) playBtn.innerHTML = `<i class="fas fa-volume-up"></i> ${vt('playing')}`;
      this.currentAudio.play().catch(() => this.speakOffline(fallbackText));
      this.currentAudio.onended = () => {
        if (playBtn) playBtn.innerHTML = `<i class="fas fa-play"></i> ${vt('replay')}`;
      };
    } else {
      this.speakOffline(fallbackText);
    }
  }

  // Submit query to Backend or Offline Engine
  async submitQuery(customText) {
    const textInput = document.getElementById('agri-voice-text-input');
    const query = (customText || textInput?.value || '').trim();
    const hasImage = !!this.selectedImageBase64;

    if (!query && !hasImage) {
      alert(vt('alertEmpty'));
      return;
    }

    const statusText = document.getElementById('agri-voice-status-text');
    const resultsCont = document.getElementById('agri-voice-results');
    const cropSelect = document.getElementById('agri-voice-crop-select');

    if (cropSelect) this.selectedCrop = cropSelect.value;
    if (statusText) statusText.innerText = vt('analyzing');

    // Show loading skeleton
    resultsCont.style.display = 'block';
    resultsCont.innerHTML = `
      <div class="bot-loading-card">
        <div class="bot-spinner"></div>
        <p>${vt('loading')}</p>
      </div>
    `;

    // 1. OFFLINE PATH
    if (!navigator.onLine) {
      setTimeout(() => {
        const offlineRes = this.getOfflineAnswer(query);
        this.renderResponseUI({
          query: query,
          reply_text: offlineRes.text,
          language: this.currentLang,
          isOffline: true
        });
        this.saveHistory({
          query: query,
          reply_text: offlineRes.text,
          date: new Date().toLocaleTimeString(),
          isOffline: true
        });
        this.speakOffline(offlineRes.text);
      }, 500);
      return;
    }

    // 2. ONLINE BACKEND PATH (existing Flask endpoint: POST /api/chat)
    try {
      const payload = {
        message: this.buildQueryMessage(query),
        image: this.selectedImageBase64 || null
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const data = await response.json();
      const replyText = data.reply || '';
      const isOffline = data.mode === 'offline';

      this.renderResponseUI({
        reply_text: replyText,
        isOffline: isOffline,
        diagnosis: this.mapDiagnosis(data.image_analysis)
      });
      this.saveHistory({
        query: query || vt('photoQuery'),
        reply_text: replyText,
        date: new Date().toLocaleTimeString(),
        isOffline: isOffline
      });

      // No server-side TTS on this endpoint -> SpeechSynthesis fallback
      this.playAudioResponse(null, replyText);

    } catch (err) {
      console.warn('Online bot request failed, switching to offline fallback:', err);
      const offlineRes = this.getOfflineAnswer(query);
      this.renderResponseUI({
        query: query,
        reply_text: offlineRes.text,
        language: this.currentLang,
        isOffline: true,
        networkFallback: true
      });
      this.speakOffline(offlineRes.text);
    }
  }

  // Selected crop is sent as text context, because /api/chat only accepts message + image
  buildQueryMessage(query) {
    const cropSelect = document.getElementById('agri-voice-crop-select');
    const cropName = cropSelect?.selectedOptions?.[0]?.textContent?.trim() || '';
    const cropPrefix = vt('cropContext');
    if (!query) return cropName ? `${cropPrefix}${cropName}` : '';
    return cropName ? `${cropPrefix}${cropName}。${query}` : query;
  }

  // /api/chat returns image_analysis = { status, prediction: { label_cn, description, ... } }
  mapDiagnosis(imageAnalysis) {
    const prediction = imageAnalysis && imageAnalysis.status === 'ok' ? imageAnalysis.prediction : null;
    if (!prediction) return null;
    return {
      success: true,
      diagnosis: {
        disease_name: prediction.label_cn,
        symptoms: prediction.description
      }
    };
  }

  // Reflect the real backend capability instead of guessing from navigator.onLine
  async syncAiStatus() {
    try {
      const response = await fetch('/api/ai/status');
      const status = response.ok ? await response.json() : null;
      this.aiConfigured = !!(status && status.configured);
    } catch (e) {
      // No reachable backend (static hosting / blocked request): answers come from the local KB
      this.aiConfigured = false;
    }
    this.updateNetworkBadge();
  }

  renderResponseUI(data) {
    this.lastResponse = data;
    const resultsCont = document.getElementById('agri-voice-results');
    const statusText = document.getElementById('agri-voice-status-text');
    if (statusText) statusText.innerText = vt('ready');

    let diagnosisHTML = '';
    if (data.diagnosis && data.diagnosis.success) {
      const diag = data.diagnosis.diagnosis || {};
      const severityColor = diag.severity === 'HIGH' ? '#ef4444' : diag.severity === 'MEDIUM' ? '#f59e0b' : '#10b981';
      const severityKey = diag.severity === 'HIGH' ? 'sevHigh' : diag.severity === 'MEDIUM' ? 'sevMedium' : 'sevLow';
      diagnosisHTML = `
        <div class="diagnosis-card">
          <div class="diag-header">
            <span class="diag-badge" style="background: ${severityColor}">🌿 ${diag.disease_name || vt('plantCondition')}</span>
            ${diag.severity ? `<span class="diag-sev">${vt('severity')}<strong>${vt(severityKey)}</strong></span>` : ''}
          </div>
          ${diag.symptoms ? `<p class="diag-symptom"><strong>${vt('symptoms')}</strong>${diag.symptoms}</p>` : ''}
        </div>
      `;
    }

    const formattedText = (data.reply_text || '')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    resultsCont.innerHTML = `
      <div class="bot-response-card ${data.isOffline ? 'offline-card' : ''}">
        ${data.isOffline ? `<div class="offline-tag"><i class="fas fa-wifi-slash"></i> ${vt('offlineTag')}</div>` : ''}
        ${diagnosisHTML}
        <div class="bot-text-body">${formattedText}</div>
        <div class="bot-audio-toolbar">
          <button id="agri-voice-play-tts-btn" class="bot-btn-play">
            <i class="fas fa-play"></i> ${vt('replay')}
          </button>
          <button id="agri-voice-clear-btn" class="bot-btn-secondary">
            <i class="fas fa-trash-alt"></i> ${vt('clear')}
          </button>
        </div>
      </div>
    `;

    document.getElementById('agri-voice-play-tts-btn')?.addEventListener('click', () => {
      this.playAudioResponse(data.audio, data.reply_text);
    });

    document.getElementById('agri-voice-clear-btn')?.addEventListener('click', () => {
      resultsCont.style.display = 'none';
      resultsCont.innerHTML = '';
      this.lastResponse = null;
      this.removeAttachedImage();
      const textInput = document.getElementById('agri-voice-text-input');
      if (textInput) textInput.value = '';
      if (statusText) statusText.innerText = vt('statusIdle');
    });
  }

  saveHistory(item) {
    try {
      const hist = JSON.parse(localStorage.getItem('agritech_bot_history') || '[]');
      hist.unshift(item);
      if (hist.length > 10) hist.pop();
      localStorage.setItem('agritech_bot_history', JSON.stringify(hist));
      this.loadHistory();
    } catch (e) {}
  }

  loadHistory() {
    const listEl = document.getElementById('agri-voice-history-list');
    if (!listEl) return;
    try {
      const hist = JSON.parse(localStorage.getItem('agritech_bot_history') || '[]');
      if (hist.length === 0) {
        listEl.innerHTML = `<p class="empty-hist">${vt('emptyHistory')}</p>`;
        return;
      }
      listEl.innerHTML = hist.map(h => `
        <div class="hist-item">
          <div class="hist-top">
            <span class="hist-query">💬 ${h.query}</span>
            <span class="hist-time">${h.date}</span>
          </div>
        </div>
      `).join('');
    } catch (e) {}
  }

  toggleAssistantModal() {
    this.isOpen = !this.isOpen;
    const modal = document.getElementById('agri-voice-assistant-modal');
    const floatBtn = document.getElementById('agri-voice-floating-btn');
    if (modal) {
      if (this.isOpen) {
        modal.classList.add('active');
        floatBtn.classList.add('active');
      } else {
        modal.classList.remove('active');
        floatBtn.classList.remove('active');
        if (this.isRecording && this.recognition) this.recognition.stop();
        if (this.currentAudio) this.currentAudio.pause();
        window.speechSynthesis?.cancel();
      }
    }
  }

  // RENDER DOM & CSS
  renderAssistantDOM() {
    if (document.getElementById('agri-voice-assistant-container')) return;

    const container = document.createElement('div');
    container.id = 'agri-voice-assistant-container';
    // The widget owns its copy (see VOICE_TEXT); keep the site-wide translator out of it.
    container.setAttribute('data-no-i18n', '');
    container.innerHTML = `
      <!-- Floating Trigger Button -->
      <button id="agri-voice-floating-btn" class="agri-floating-mic-btn" data-voice-i18n-title="floatingLabel">
        <div class="mic-icon-wrapper">
          <i class="fas fa-microphone"></i>
        </div>
        <span class="mic-floating-label" data-voice-i18n="floatingLabel">${vt('floatingLabel')}</span>
        <span class="pulse-ring"></span>
      </button>

      <!-- Floating Assistant Drawer / Modal -->
      <div id="agri-voice-assistant-modal" class="agri-voice-modal">
        <div class="modal-header">
          <div class="header-branding">
            <div class="bot-avatar"><i class="fas fa-seedling"></i></div>
            <div>
              <h3 data-voice-i18n="assistantTitle">${vt('assistantTitle')}</h3>
              <div id="agri-bot-network-badge" class="network-badge ${navigator.onLine ? 'online' : 'offline'}">
                <span class="pulse-dot ${navigator.onLine ? '' : 'offline'}"></span>
                ${navigator.onLine ? vt('online') : vt('offline')}
              </div>
            </div>
          </div>
          <button id="agri-voice-close-btn" class="modal-close-btn" data-voice-i18n-title="close">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Language & Crop Filter Bar -->
          <div class="agri-filter-bar">
            <div class="filter-group">
              <label><i class="fas fa-language"></i> <span data-voice-i18n="langLabel">${vt('langLabel')}</span></label>
              <select id="agri-voice-lang-select">








                <option value="zh">中文（普通话）</option>
                <option value="en">English</option>
              </select>
            </div>
            <div class="filter-group">
              <label><i class="fas fa-leaf"></i> <span data-voice-i18n="cropLabel">${vt('cropLabel')}</span></label>
              <select id="agri-voice-crop-select"></select>
            </div>
          </div>

          <!-- Main Interactive Voice Core -->
          <div class="voice-hero-card">
            <div id="agri-voice-wave" class="audio-waveform" style="display: none;">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>

            <button id="agri-voice-mic-main" class="main-mic-trigger" data-voice-i18n-title="tapToSpeak">
              <i class="fas fa-microphone"></i>
            </button>
            <p id="agri-voice-status-text" class="voice-status" data-voice-i18n="statusIdle">${vt('statusIdle')}</p>

            <!-- Multimodal Plant Photo Attachment Preview -->
            <div id="agri-voice-img-preview-cont" class="image-preview-badge" style="display: none;">
              <img id="agri-voice-img-preview" src="" alt="${vt('photoAlt')}">
              <span data-voice-i18n="photoAttached">${vt('photoAttached')}</span>
              <button id="agri-voice-remove-img" class="remove-img-btn">&times;</button>
            </div>
          </div>

          <!-- Text Input & Attachment Bar -->
          <div class="agri-input-dock">
            <input type="file" id="agri-voice-photo-input" accept="image/*" capture="environment" style="display: none;">
            <button id="agri-voice-cam-btn" class="dock-btn photo-btn" data-voice-i18n-title="snapPhoto">
              <i class="fas fa-camera"></i>
            </button>
            <input type="text" id="agri-voice-text-input" placeholder="${vt('placeholder')}" autocomplete="off">
            <button id="agri-voice-send-btn" class="dock-btn send-btn" data-voice-i18n-title="submit">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>

          <!-- Advisory Output Card -->
          <div id="agri-voice-results" class="results-container" style="display: none;"></div>

          <!-- Recent Advisory History -->
          <div class="agri-history-drawer">
            <h4><i class="fas fa-history"></i> <span data-voice-i18n="recent">${vt('recent')}</span></h4>
            <div id="agri-voice-history-list" class="history-list"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.injectStyles();
    this.renderCropOptions();
    this.attachEventListeners();
    this.applyLanguage();
  }

  attachEventListeners() {
    document.getElementById('agri-voice-floating-btn')?.addEventListener('click', () => this.toggleAssistantModal());
    document.getElementById('agri-voice-close-btn')?.addEventListener('click', () => this.toggleAssistantModal());
    document.getElementById('agri-voice-mic-main')?.addEventListener('click', () => this.toggleRecording());

    document.getElementById('agri-voice-cam-btn')?.addEventListener('click', () => {
      document.getElementById('agri-voice-photo-input')?.click();
    });

    document.getElementById('agri-voice-photo-input')?.addEventListener('change', (e) => this.handleImageUpload(e));
    document.getElementById('agri-voice-remove-img')?.addEventListener('click', () => this.removeAttachedImage());

    document.getElementById('agri-voice-send-btn')?.addEventListener('click', () => this.submitQuery());
    document.getElementById('agri-voice-text-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submitQuery();
      }
    });

    const langSelect = document.getElementById('agri-voice-lang-select');
    if (langSelect) {
      langSelect.value = this.currentLang;
      langSelect.addEventListener('change', (e) => {
        this.currentLang = e.target.value === 'en' ? 'en' : 'zh';
        localStorage.setItem('agritech_bot_lang', this.currentLang);
        if (this.recognition) this.recognition.lang = VOICE_RECOGNITION_LANG[this.currentLang];
      });
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.id = 'agri-voice-assistant-styles';
    style.textContent = `
      /* FLOATING TRIGGER BUTTON */
      #agri-voice-assistant-container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        z-index: 99999;
      }
      .agri-floating-mic-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        border: none;
        border-radius: 50px;
        padding: 10px 18px 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.45);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 99999;
      }
      .agri-floating-mic-btn:hover {
        transform: translateY(-4px) scale(1.04);
        box-shadow: 0 12px 30px rgba(16, 185, 129, 0.6);
      }
      .mic-icon-wrapper {
        width: 38px;
        height: 38px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
      }
      .mic-floating-label {
        font-weight: 600;
        font-size: 14px;
        letter-spacing: 0.3px;
      }
      .pulse-ring {
        position: absolute;
        inset: -4px;
        border-radius: 50px;
        border: 2px solid rgba(16, 185, 129, 0.7);
        animation: pulseWave 2s infinite;
        pointer-events: none;
      }
      @keyframes pulseWave {
        0% { transform: scale(0.95); opacity: 0.8; }
        50% { transform: scale(1.08); opacity: 0; }
        100% { transform: scale(0.95); opacity: 0; }
      }

      /* FLOATING ASSISTANT MODAL */
      .agri-voice-modal {
        position: fixed;
        bottom: 90px;
        right: 24px;
        width: 390px;
        max-width: calc(100vw - 32px);
        max-height: 82vh;
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 99999;
        transform: scale(0.85) translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border: 1px solid rgba(16, 185, 129, 0.2);
      }
      .agri-voice-modal.active {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: auto;
      }
      .modal-header {
        background: linear-gradient(135deg, #065f46, #047857);
        color: #ffffff;
        padding: 16px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .header-branding {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .bot-avatar {
        width: 38px;
        height: 38px;
        background: #10b981;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
      .header-branding h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
      }
      .network-badge {
        font-size: 11px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-top: 3px;
        padding: 2px 8px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.2);
      }
      .pulse-dot {
        width: 7px;
        height: 7px;
        background: #34d399;
        border-radius: 50%;
      }
      .pulse-dot.offline { background: #f87171; }
      .modal-close-btn {
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
        padding: 4px;
      }

      .modal-body {
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
        background: #f8fafc;
      }

      /* FILTER BAR */
      .agri-filter-bar {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        background: #ffffff;
        padding: 8px 12px;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .filter-group label {
        font-size: 11px;
        color: #64748b;
        font-weight: 600;
      }
      .filter-group select {
        font-size: 12px;
        padding: 4px 6px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        color: #1e293b;
        outline: none;
      }

      /* HERO VOICE MIC */
      .voice-hero-card {
        background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
        border: 1px dashed #86efac;
        border-radius: 16px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 10px;
        position: relative;
      }
      .main-mic-trigger {
        width: 66px;
        height: 66px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981, #059669);
        color: #ffffff;
        border: none;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
        transition: all 0.25s ease;
      }
      .main-mic-trigger:hover {
        transform: scale(1.08);
      }
      .main-mic-trigger.recording {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        animation: pulseRecording 1.2s infinite;
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
      }
      @keyframes pulseRecording {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.12); }
      }
      .voice-status {
        font-size: 13px;
        color: #475569;
        font-weight: 500;
        margin: 0;
      }

      /* AUDIO WAVEFORM */
      .audio-waveform {
        display: flex;
        gap: 4px;
        align-items: center;
        height: 20px;
      }
      .audio-waveform span {
        width: 3px;
        height: 100%;
        background: #10b981;
        border-radius: 3px;
        animation: wavePulse 1s ease-in-out infinite;
      }
      .audio-waveform span:nth-child(2) { animation-delay: 0.15s; }
      .audio-waveform span:nth-child(3) { animation-delay: 0.3s; }
      .audio-waveform span:nth-child(4) { animation-delay: 0.45s; }
      .audio-waveform span:nth-child(5) { animation-delay: 0.6s; }
      @keyframes wavePulse {
        0%, 100% { transform: scaleY(0.3); }
        50% { transform: scaleY(1.2); }
      }

      /* IMAGE PREVIEW */
      .image-preview-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ffffff;
        padding: 4px 10px;
        border-radius: 20px;
        border: 1px solid #cbd5e1;
        font-size: 11.5px;
        color: #334155;
      }
      .image-preview-badge img {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        object-fit: cover;
      }
      .remove-img-btn {
        background: none;
        border: none;
        color: #ef4444;
        font-size: 16px;
        cursor: pointer;
      }

      /* INPUT DOCK */
      .agri-input-dock {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 4px 6px;
      }
      .agri-input-dock input[type="text"] {
        flex: 1;
        border: none;
        outline: none;
        font-size: 13.5px;
        padding: 6px 8px;
        background: transparent;
        color: #0f172a;
      }
      .dock-btn {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      .dock-btn.photo-btn {
        background: #f1f5f9;
        color: #475569;
      }
      .dock-btn.photo-btn:hover { background: #e2e8f0; }
      .dock-btn.send-btn {
        background: #10b981;
        color: #ffffff;
      }
      .dock-btn.send-btn:hover { background: #059669; }

      /* RESPONSE CARD */
      .bot-response-card {
        background: #ffffff;
        border-radius: 14px;
        padding: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.07);
        border-left: 4px solid #10b981;
      }
      .bot-response-card.offline-card {
        border-left-color: #f59e0b;
      }
      .offline-tag {
        font-size: 11px;
        font-weight: 600;
        color: #d97706;
        margin-bottom: 8px;
      }
      .diagnosis-card {
        background: #f0fdf4;
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 10px;
        border: 1px solid #bbf7d0;
      }
      .diag-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
      }
      .diag-badge {
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;
      }
      .diag-symptom {
        font-size: 12px;
        color: #334155;
        margin: 4px 0 0 0;
      }
      .bot-text-body {
        font-size: 13.5px;
        line-height: 1.55;
        color: #1e293b;
      }
      .bot-audio-toolbar {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .bot-btn-play {
        background: #10b981;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .bot-btn-secondary {
        background: #f1f5f9;
        color: #64748b;
        border: none;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }
      .bot-loading-card {
        background: #ffffff;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        font-size: 13px;
        color: #64748b;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .bot-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #e2e8f0;
        border-top-color: #10b981;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* HISTORY */
      .agri-history-drawer {
        margin-top: 4px;
      }
      .agri-history-drawer h4 {
        font-size: 12px;
        color: #64748b;
        margin: 0 0 6px 0;
        font-weight: 600;
      }
      .history-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .hist-item {
        background: #ffffff;
        padding: 6px 10px;
        border-radius: 8px;
        font-size: 12px;
      }
      .hist-top {
        display: flex;
        justify-content: space-between;
        color: #334155;
      }
      .hist-time { color: #94a3b8; font-size: 11px; }
      .empty-hist { font-size: 11.5px; color: #94a3b8; margin: 0; }

      /* DARK THEME COMPATIBILITY */
      [data-theme="dark"] .agri-voice-modal,
      body.dark-theme .agri-voice-modal {
        background: #0f172a;
        border-color: #334155;
        color: #f1f5f9;
      }
      [data-theme="dark"] .modal-body,
      body.dark-theme .modal-body {
        background: #1e293b;
      }
      [data-theme="dark"] .voice-hero-card,
      body.dark-theme .voice-hero-card {
        background: #0f172a;
        border-color: #059669;
      }
      [data-theme="dark"] .voice-status,
      body.dark-theme .voice-status {
        color: #cbd5e1;
      }
      [data-theme="dark"] .agri-filter-bar,
      [data-theme="dark"] .agri-input-dock,
      [data-theme="dark"] .bot-response-card,
      [data-theme="dark"] .hist-item,
      body.dark-theme .agri-filter-bar,
      body.dark-theme .agri-input-dock,
      body.dark-theme .bot-response-card,
      body.dark-theme .hist-item {
        background: #0f172a;
        color: #f1f5f9;
        border-color: #334155;
      }
      [data-theme="dark"] .agri-input-dock input[type="text"],
      body.dark-theme .agri-input-dock input[type="text"] {
        color: #f8fafc;
      }
      [data-theme="dark"] .bot-text-body,
      body.dark-theme .bot-text-body {
        color: #e2e8f0;
      }
    `;
    document.head.appendChild(style);
  }
}

// -----------------------------------------------------------------------------
// 4. AUTO-INITIALIZATION
// -----------------------------------------------------------------------------
const voiceInputManager = new VoiceInputManager();
let agriVoiceAssistant = null;

function initAgriVoiceSystem() {
  voiceInputManager.initializePageVoiceInputs();
  if (!agriVoiceAssistant) {
    agriVoiceAssistant = new AgriVoiceAssistant();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAgriVoiceSystem);
} else {
  initAgriVoiceSystem();
}

// Expose globally
window.voiceInputManager = voiceInputManager;
window.agriVoiceAssistant = agriVoiceAssistant;
