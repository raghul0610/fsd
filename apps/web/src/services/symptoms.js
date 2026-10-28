const SYMPTOMS = {
  en: [
    ['palpitations', ['palpitations', 'heart racing', 'racing heart', 'heart pounding', 'irregular heartbeat', 'heart fluttering']],
    ['fever', ['fever', 'high temperature', 'body temperature', 'feeling feverish', 'body heat']],
    ['cough', ['cough', 'coughing']],
    ['headache', ['headache', 'head pain', 'migraine']],
    ['chest pain', ['chest pain', 'pain in my chest', 'tight chest']],
    ['breathing difficulty', ['shortness of breath', 'difficulty breathing', 'breathless', "can't breathe", 'cannot breathe']],
    ['dizziness', ['dizziness', 'dizzy', 'lightheaded', 'feeling faint']],
    ['stomach pain', ['stomach pain', 'abdominal pain', 'belly pain', 'stomach ache']],
    ['vomiting', ['vomiting', 'throwing up', 'nausea']],
    ['diarrhea', ['diarrhea', 'diarrhoea', 'loose stools', 'loose motion']],
    ['weakness', ['weakness', 'feeling weak', 'fatigue', 'very tired']],
    ['rash', ['rash', 'skin rash', 'itchy skin']],
    ['swelling', ['swelling', 'swollen']],
    ['urinary pain', ['painful urination', 'burning urination', 'burning when urinating']],
    ['bleeding', ['heavy bleeding', 'bleeding that will not stop']],
  ],
  ta: [
    ['fever', ['காய்ச்சல்', 'உடல் சூடு']],
    ['headache', ['தலைவலி']],
    ['cough', ['இருமல்']],
    ['breathing difficulty', ['மூச்சுத்திணறல்', 'மூச்சு விட சிரமம்']],
    ['chest pain', ['மார்பு வலி']],
    ['stomach pain', ['வயிற்று வலி']],
    ['vomiting', ['வாந்தி']],
    ['diarrhea', ['வயிற்றுப்போக்கு']],
    ['dizziness', ['தலைச்சுற்றல்']],
    ['weakness', ['பலவீனம்']],
    ['palpitations', ['இதயத் துடிப்பு அதிகம்', 'இதயம் படபடப்பு']],
  ],
  hi: [
    ['fever', ['बुखार', 'तेज बुखार']],
    ['headache', ['सिरदर्द', 'सिर में दर्द']],
    ['cough', ['खांसी', 'खाँसी']],
    ['breathing difficulty', ['सांस लेने में कठिनाई', 'सांस फूलना', 'साँस लेने में कठिनाई']],
    ['chest pain', ['सीने में दर्द', 'छाती में दर्द']],
    ['stomach pain', ['पेट दर्द', 'पेट में दर्द']],
    ['vomiting', ['उल्टी', 'मतली']],
    ['diarrhea', ['दस्त', 'पतले दस्त']],
    ['dizziness', ['चक्कर', 'चक्कर आना']],
    ['weakness', ['कमजोरी', 'थकान']],
    ['palpitations', ['दिल की धड़कन तेज', 'दिल धड़कना']],
  ],
};

const EMERGENCY_TERMS = [
  'chest pain', 'severe chest pain', 'shortness of breath', 'difficulty breathing',
  "can't breathe", 'cannot breathe', 'unconscious', 'fainting', 'heavy bleeding',
  'seizure', 'convulsion', 'blue lips', 'sudden weakness on one side',
  'மார்பு வலி', 'மூச்சுத்திணறல்', 'நினைவிழப்பு', 'அதிக இரத்தப்போக்கு',
  'सीने में दर्द', 'सांस लेने में कठिनाई', 'बेहोशी', 'भारी रक्तस्राव',
];

function normalize(value = '') {
  return String(value).normalize('NFKC').toLowerCase().replace(/[?!,.;:()[\]{}"'’`]/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasPhrase(text, phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu').test(text);
}

export function detectSymptoms(input, language = 'en') {
  const text = normalize(input);
  if (!text) return { recognized: [], emergency: false };

  const groups = [...(SYMPTOMS[language] || []), ...(language === 'en' ? [] : SYMPTOMS.en)];
  const recognized = groups
    .filter(([, aliases]) => aliases.some((alias) => hasPhrase(text, normalize(alias))))
    .map(([name]) => name)
    .filter((name, index, all) => all.indexOf(name) === index);

  return {
    recognized,
    emergency: EMERGENCY_TERMS.some((term) => hasPhrase(text, normalize(term))),
  };
}

export function symptomGuidance(language = 'en', symptoms = []) {
  const primary = symptoms[0] || 'symptom';
  const guidance = {
    en: `I understood that you may be experiencing ${symptoms.join(', ') || primary}. I cannot diagnose the cause. To help you decide what to do next, please tell me: (1) how long this has been happening, (2) how severe it feels from 1 to 5, and (3) your age group and whether it is getting worse.\n\nFor now, rest somewhere safe and avoid starting new medicines based only on this chat. Contact your nearest Primary Health Centre (PHC) or ASHA/community health worker for advice, especially if symptoms persist or worry you. If you have chest pain, difficulty breathing, fainting, heavy bleeding, confusion, or rapidly worsening symptoms, seek urgent medical care now.\n\nThis information is not a diagnosis. If you share duration and severity, I can record a more useful symptom assessment in your history.`,
    ta: `உங்களுக்கு ${symptoms.join(', ') || primary} இருக்கலாம் என்று புரிந்துகொண்டேன். இதன் காரணத்தை என்னால் கண்டறிய முடியாது. அடுத்த படியைப் புரிந்துகொள்ள: (1) எவ்வளவு நேரமாக/நாட்களாக உள்ளது, (2) தீவிரம் 1 முதல் 5 வரை எவ்வளவு, (3) உங்கள் வயது பிரிவு என்ன, அறிகுறி மோசமடைகிறதா என்பதைச் சொல்லுங்கள்.\n\nஇப்போது பாதுகாப்பான இடத்தில் ஓய்வெடுக்கவும்; இந்த உரையாடலை மட்டும் நம்பி புதிய மருந்துகளைத் தொடங்க வேண்டாம். அறிகுறிகள் நீடித்தாலோ கவலை அளித்தாலோ அருகிலுள்ள ஆரம்ப சுகாதார நிலையம் (PHC) அல்லது ASHA/சமூக சுகாதாரப் பணியாளரை அணுகவும். மார்பு வலி, மூச்சுத்திணறல், மயக்கம், அதிக இரத்தப்போக்கு, குழப்பம் அல்லது வேகமாக மோசமடையும் அறிகுறிகள் இருந்தால் உடனடி மருத்துவ உதவியைப் பெறுங்கள்.\n\nஇது நோயறிதல் அல்ல. கால அளவும் தீவிரமும் தெரிவித்தால், உங்கள் வரலாற்றில் பயனுள்ள அறிகுறி மதிப்பீட்டைச் சேமிக்க முடியும்.`,
    hi: `मैंने समझा कि आपको ${symptoms.join(', ') || primary} हो सकता है। मैं इसका कारण पता नहीं लगा सकता। आगे मदद के लिए बताएं: (1) यह कब से हो रहा है, (2) गंभीरता 1 से 5 में कितनी है, और (3) आपकी आयु-श्रेणी क्या है तथा क्या लक्षण बढ़ रहे हैं?\n\nअभी सुरक्षित जगह पर आराम करें और केवल इस चैट के आधार पर नई दवा शुरू न करें। लक्षण बने रहें या चिंता हो तो नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) या ASHA/सामुदायिक स्वास्थ्य कार्यकर्ता से संपर्क करें। सीने में दर्द, सांस लेने में कठिनाई, बेहोशी, अधिक रक्तस्राव, भ्रम या तेजी से बिगड़ते लक्षण हों तो तुरंत चिकित्सा सहायता लें।\n\nयह निदान नहीं है। अवधि और गंभीरता बताने पर मैं आपके इतिहास में अधिक उपयोगी लक्षण आकलन दर्ज कर सकता हूँ।`,
  };
  return guidance[language] || guidance.en;
}
