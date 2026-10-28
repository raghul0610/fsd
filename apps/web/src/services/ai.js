import { searchKnowledge } from './knowledge';
import { detectSymptoms, symptomGuidance } from './symptoms';
import { assessRisk, parseAssessmentInput } from './triage';

function normalize(value = '') {
  return String(value).normalize('NFKC').trim().toLowerCase().replace(/[?!,.;:()[\]{}"'’`]/g, ' ').replace(/\s+/g, ' ');
}

const messages = {
  en: {
    empty: 'Please enter a health question or describe your symptoms.',
    greeting: 'Hello. I can help you search the saved health information, review your recent assessment history, and explain what is stored on this device. Describe what you need help with.',
    thanks: 'You’re welcome. If you have another health question, describe the symptom or topic and I’ll check the saved health information.',
    noAssessment: 'I could not find an assessment on this device yet. Open Check Symptoms, complete an assessment, and I can explain the stored result here.',
    noMatch: 'I could not find a matching topic in the offline health library. Try describing the symptom or topic with a few specific words, or seek professional healthcare advice if you are concerned.',
    safety: 'I do not have enough matching local information to assess this safely. If you may have an emergency or severe/worsening symptoms, seek urgent professional or emergency care now.',
    historyHeader: 'Here is what is stored locally on this device.',
    assessmentHeader: 'Your latest stored assessment is',
    risk: 'risk',
    symptoms: 'Symptoms',
    severity: 'Severity',
    duration: 'Duration',
    reason: 'Reason',
    noHistory: 'There is no assessment history stored on this device yet.',
    noChats: 'There is no previous chat history stored on this device yet.',
    localContext: 'This assessment is kept as local context and is not a diagnosis.',
    source: 'Source',
    assessmentDisclaimer: 'This is a demonstration triage result, not a diagnosis. If symptoms are severe, worsening, or concerning, seek professional care.',
  },
  ta: {
    empty: 'சுகாதாரக் கேள்வியை உள்ளிடவும் அல்லது உங்கள் அறிகுறிகளை விவரிக்கவும்.',
    greeting: 'வணக்கம். சேமிக்கப்பட்ட சுகாதார தகவல்கள், உங்கள் சமீபத்திய மதிப்பீட்டு வரலாறு மற்றும் இந்த சாதனத்தில் சேமிக்கப்பட்ட தகவல்களைப் புரிந்துகொள்ள நான் உதவ முடியும். உங்களுக்கு தேவையானதை விவரிக்கவும்.',
    thanks: 'வரவேற்கிறேன். மற்றொரு சுகாதாரக் கேள்வி இருந்தால் அறிகுறி அல்லது தலைப்பை விவரிக்கவும்; சேமிக்கப்பட்ட சுகாதார தகவல்களைச் சரிபார்க்கிறேன்.',
    noAssessment: 'இந்த சாதனத்தில் இன்னும் மதிப்பீடு கிடைக்கவில்லை. அறிகுறிகளைச் சரிபார்த்து ஒரு மதிப்பீட்டை முடிக்கவும்; அதன் சேமிக்கப்பட்ட முடிவை இங்கே விளக்க முடியும்.',
    noMatch: 'ஆஃப்லைன் சுகாதார நூலகத்தில் பொருத்தமான தலைப்பு கிடைக்கவில்லை. அறிகுறி அல்லது தலைப்பை சில குறிப்பிட்ட சொற்களுடன் விவரிக்கவும் அல்லது கவலை இருந்தால் மருத்துவ ஆலோசனையைப் பெறவும்.',
    safety: 'இதை பாதுகாப்பாக மதிப்பிட போதுமான உள்ளூர் தகவல் இல்லை. அவசர நிலை அல்லது கடுமையாக மோசமடையும் அறிகுறிகள் இருந்தால் உடனடி மருத்துவ அல்லது அவசர சிகிச்சையைப் பெறுங்கள்.',
    historyHeader: 'இந்த சாதனத்தில் உள்ளூரில் சேமிக்கப்பட்ட தகவல்கள்:',
    assessmentHeader: 'உங்கள் சமீபத்திய சேமிக்கப்பட்ட மதிப்பீடு:',
    risk: 'ஆபத்து',
    symptoms: 'அறிகுறிகள்',
    severity: 'தீவிரம்',
    duration: 'கால அளவு',
    reason: 'காரணம்',
    noHistory: 'இந்த சாதனத்தில் இன்னும் மதிப்பீட்டு வரலாறு இல்லை.',
    noChats: 'இந்த சாதனத்தில் முந்தைய உரையாடல் வரலாறு இல்லை.',
    localContext: 'இந்த மதிப்பீடு உள்ளூர் சூழலாக மட்டுமே வைக்கப்பட்டுள்ளது; இது நோயறிதல் அல்ல.',
    source: 'ஆதாரம்',
    assessmentDisclaimer: 'இது ஒரு நிரூபண மதிப்பீட்டு முடிவு மட்டுமே; நோயறிதல் அல்ல. அறிகுறிகள் தீவிரமாகவோ மோசமடைந்தாலோ மருத்துவ உதவியைப் பெறுங்கள்.',
  },
  hi: {
    empty: 'स्वास्थ्य प्रश्न दर्ज करें या अपने लक्षणों का वर्णन करें।',
    greeting: 'नमस्ते। मैं सहेजी गई स्वास्थ्य जानकारी खोजने, हाल के आकलन इतिहास की समीक्षा करने और इस डिवाइस पर संग्रहीत जानकारी समझने में मदद कर सकता हूँ। अपनी जरूरत बताएं।',
    thanks: 'आपका स्वागत है। कोई और स्वास्थ्य प्रश्न हो तो लक्षण या विषय बताएं; मैं सहेजी गई स्वास्थ्य जानकारी देखूंगा।',
    noAssessment: 'इस डिवाइस पर अभी कोई आकलन नहीं मिला। लक्षण जांचें और आकलन पूरा करें; मैं यहां सहेजे गए परिणाम को समझा सकता हूँ।',
    noMatch: 'ऑफलाइन स्वास्थ्य पुस्तकालय में संबंधित विषय नहीं मिला। लक्षण या विषय को कुछ स्पष्ट शब्दों में बताएं, या चिंता होने पर स्वास्थ्य पेशेवर से सलाह लें।',
    safety: 'इसे सुरक्षित रूप से समझने के लिए पर्याप्त स्थानीय जानकारी नहीं है। यदि आपातकाल हो या लक्षण गंभीर रूप से बिगड़ रहे हों, तो तुरंत पेशेवर या आपातकालीन चिकित्सा सहायता लें।',
    historyHeader: 'इस डिवाइस पर स्थानीय रूप से संग्रहीत जानकारी:',
    assessmentHeader: 'आपका नवीनतम सहेजा गया आकलन:',
    risk: 'जोखिम',
    symptoms: 'लक्षण',
    severity: 'तीव्रता',
    duration: 'अवधि',
    reason: 'कारण',
    noHistory: 'इस डिवाइस पर अभी कोई आकलन इतिहास नहीं है।',
    noChats: 'इस डिवाइस पर पिछली चैट का इतिहास नहीं है।',
    localContext: 'यह आकलन केवल स्थानीय संदर्भ के रूप में रखा गया है; यह निदान नहीं है।',
    source: 'स्रोत',
    assessmentDisclaimer: 'यह केवल प्रदर्शन के लिए आकलन परिणाम है, निदान नहीं। लक्षण गंभीर हों या बिगड़ें तो चिकित्सा सहायता लें।',
  },
};

function copy(language) {
  return messages[language] || messages.en;
}

function recentAssessmentSummary(assessments = [], language = 'en') {
  const m = copy(language);
  if (!assessments.length) return m.noHistory;
  return assessments.slice(0, 5).map((item, index) =>
    `${index + 1}. ${item.risk} ${m.risk} — ${m.symptoms}: ${item.symptoms}; ${m.severity} ${item.severity}/5; ${m.duration} ${item.durationDays} day(s); ${item.reason}`
  ).join('\n');
}

function recentConversationSummary(conversations = [], language = 'en') {
  const m = copy(language);
  if (!conversations.length) return m.noChats;
  return conversations.slice(0, 5).map((item, index) => `${index + 1}. ${item.title || 'Health question'}`).join('\n');
}

function isGreeting(question) {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|how are you|வணக்கம்|ஹலோ|नमस्ते|नमस्कार)\b/i.test(question);
}

function asksAboutAssessment(question) {
  return /(assessment|assess|risk|symptom check|checkup|my symptoms|what did my test|my result|மதிப்பீடு|ஆபத்து|அறிகுறி|मूल्यांकन|जोखिम|लक्षण)/i.test(question);
}

function asksAboutHistory(question) {
  return /(history|previous|earlier|last|past|old|conversation|chat|what did i ask|what did we discuss|வரலாறு|முந்தைய|முன்பு|உரையாடல்|इतिहास|पिछला|पहले|बातचीत)/i.test(question);
}

function asksForEmergencyHelp(question) {
  return /(emergency|urgent|danger|serious|hospital|ambulance|can't breathe|cannot breathe|breathing difficulty|unconscious|heavy bleeding|severe chest pain|seizure|convulsion|அவசரம்|மருத்துவமனை|ஆம்புலன்ஸ்|மூச்சுத்திணறல்|மூச்சு.*சிரமம்|நினைவிழப்பு|இரத்தப்போக்கு|மார்பு வலி|வலிப்பு|आपातकाल|अस्पताल|एम्बुलेंस|सांस.*दिक्कत|बेहोशी|खून.*बहना|सीने में दर्द|दौरा)/i.test(question);
}

export class LocalAIProvider {
  async answer(question, { language = 'en', assessments = [], conversations = [] } = {}) {
    const normalized = normalize(question);
    const m = copy(language);

    if (!normalized) return { text: m.empty, sources: [], context: 'empty' };

    if (isGreeting(normalized)) return { text: m.greeting, sources: [], context: 'conversation' };

    if (/^(thanks|thank you|thx|ok|okay|got it|great|நன்றி|சரி|धन्यवाद|ठीक|ठीक है)\b/i.test(normalized)) {
      return { text: m.thanks, sources: [], context: 'conversation' };
    }

    if (asksAboutAssessment(normalized)) {
      const latest = assessments[0];
      if (!latest) return { text: m.noAssessment, sources: [], context: 'assessment' };
      return {
        text: `${m.assessmentHeader} **${latest.risk} ${m.risk}**.\n\n${m.symptoms}: ${latest.symptoms}\n${m.severity}: ${latest.severity}/5\n${m.duration}: ${latest.durationDays} day(s)\n${m.reason}: ${latest.reason}\n\n${m.assessmentDisclaimer}`,
        sources: [],
        context: 'assessment',
      };
    }

    if (asksAboutHistory(normalized)) {
      return {
        text: `${m.historyHeader}\n\n${language === 'ta' ? 'மதிப்பீட்டு வரலாறு:' : language === 'hi' ? 'आकलन इतिहास:' : 'Assessment history:'}\n${recentAssessmentSummary(assessments, language)}\n\n${language === 'ta' ? 'சமீபத்திய உரையாடல் தலைப்புகள்:' : language === 'hi' ? 'हाल की चैट के विषय:' : 'Recent chat topics:'}\n${recentConversationSummary(conversations, language)}`,
        sources: [],
        context: 'history',
      };
    }

    const symptomResult = detectSymptoms(question, language);
    const isKnowledgeQuestion = /^(what should i know about|tell me about|explain|what is|what are|information about|how does|causes of|prevention of)\\b/i.test(normalized);\n    if (symptomResult.recognized.length && !isKnowledgeQuestion) {
      const parsed = parseAssessmentInput(question, language);
      const severity = symptomResult.emergency ? 5 : (parsed.severity ?? 3);
      const durationDays = parsed.durationDays ?? 0;
      const riskResult = assessRisk({ symptoms: question, severity, durationDays });
      const assessment = {
        symptoms: question,
        severity,
        durationDays,
        ...riskResult,
        risk: symptomResult.emergency ? 'CRITICAL' : riskResult.risk,
        reason: symptomResult.emergency
          ? 'A possible emergency warning sign was mentioned. Seek urgent professional care now.'
          : 'Symptom reported in chat; severity and duration may be incomplete. This precautionary record is not a diagnosis.',
      };
      return {
        text: symptomResult.emergency
          ? `Your message includes a possible emergency warning sign. Please seek urgent medical care now or contact local emergency services. Do not wait for a chatbot response.\n\n${symptomGuidance(language, symptomResult.recognized)}`
          : symptomGuidance(language, symptomResult.recognized),
        sources: [],
        context: 'symptom',
        assessment,
      };
    }

    const documents = await searchKnowledge(question, language);

    if (!documents.length) {
      if (asksForEmergencyHelp(normalized)) return { text: m.safety, sources: [], context: 'safety' };
      return { text: m.noMatch, sources: [], context: 'unknown' };
    }

    const primary = documents[0];
    const related = documents.slice(1);
    const relatedText = related.length
      ? `\n\nRelated saved information:\n${related.map((document) => `• ${document.title}: ${document.content}`).join('\n')}`
      : '';

    let contextText = '';
    if (assessments.length) {
      const latest = assessments[0];
      contextText = `\n\n${m.assessmentHeader} ${latest.risk} ${m.risk}, ${m.severity.toLowerCase()} ${latest.severity}/5, ${m.duration.toLowerCase()} ${latest.durationDays} day(s). ${m.localContext}`;
    }

    return {
      text: `${primary.content}${relatedText}${contextText}\n\n${m.source}: ${primary.source}`,
      sources: documents.map((document) => document.id),
      context: 'knowledge',
    };
  }
}

export class CloudAIProvider {
  async answer() {
    throw new Error('Cloud AI is intentionally disabled in the offline core. Configure a reviewed provider before enabling it.');
  }
}

export function createAIProvider(mode = 'local') {
  return mode === 'cloud' ? new CloudAIProvider() : new LocalAIProvider();
}
