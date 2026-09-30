const criticalPatterns = [
  /unconscious/i,
  /cannot breathe/i,
  /can't breathe/i,
  /severe breathing/i,
  /blue lips/i,
  /heavy bleeding/i,
  /chest pain/i,
  /convulsion/i,
  /seizure/i,
  /மூச்சுத்திணறல்|நினைவிழப்பு|மார்பு வலி|வலிப்பு|கடுமையான இரத்தப்போக்கு/i,
  /सांस लेने में कठिनाई|बेहोशी|सीने में दर्द|दौरा|भारी रक्तस्राव/i,
];

const severityMap = {
  en: {
    mild: 1,
    slight: 1,
    moderate: 3,
    severe: 5,
    'very severe': 5,
    serious: 5,
  },
  ta: {
    'லேசான': 1,
    'மிதமான': 3,
    'கடுமையான': 5,
    'மிகவும் கடுமையான': 5,
  },
  hi: {
    'हल्का': 1,
    'मध्यम': 3,
    'गंभीर': 5,
    'बहुत गंभीर': 5,
  },
};

function normalize(value = '') {
  return String(value).normalize('NFKC').toLowerCase().trim();
}

function extractDurationDays(text) {
  const normalized = normalize(text);
  const match = normalized.match(/(?:for\s*)?(\d+)\s*(day|days|दिन|दिनों|நாள்|நாட்கள்)\b/i);
  if (match) return Number(match[1]);

  const weekMatch = normalized.match(/(\d+)\s*(week|weeks|வாரம்|வாரங்கள்|सप्ताह|हफ्ते)\b/i);
  if (weekMatch) return Number(weekMatch[1]) * 7;

  const monthMatch = normalized.match(/(\d+)\s*(month|months|மாதம்|மாதங்கள்|महीना|महीने)\b/i);
  if (monthMatch) return Number(monthMatch[1]) * 30;

  return null;
}

function extractSeverity(text, language = 'en') {
  const normalized = normalize(text);

  const numeric = normalized.match(/(?:severity|pain|intensity|தீவிரம்|வலி|तीव्रता|दर्द)\s*(?:is|=|:)?\s*([1-5])\b/i);
  if (numeric) return Number(numeric[1]);

  const aliases = severityMap[language] || severityMap.en;
  for (const [label, value] of Object.entries(aliases)) {
    if (normalized.includes(label)) return value;
  }

  return null;
}

export function parseAssessmentInput(text, language = 'en') {
  const symptoms = String(text || '').trim();
  return {
    symptoms,
    durationDays: extractDurationDays(symptoms),
    severity: extractSeverity(symptoms, language),
  };
}

export function assessRisk({ symptoms = '', severity = 1, durationDays = 0 }) {
  const text = String(symptoms).trim();
  if (!text) throw new Error('Symptoms are required');

  if (criticalPatterns.some((pattern) => pattern.test(text)) || Number(severity) >= 5) {
    return {
      risk: 'CRITICAL',
      reason: 'A potential emergency warning sign was detected. Seek urgent professional or emergency care.',
    };
  }

  if (Number(severity) >= 3 || Number(durationDays) >= 7) {
    return {
      risk: 'MODERATE',
      reason: 'Symptoms may need professional evaluation, especially if persistent or worsening.',
    };
  }

  return {
    risk: 'LOW',
    reason: 'No critical rule was triggered. Monitor symptoms and seek professional care if they worsen or persist.',
  };
}

export class TriageEngine {
  assess(input) {
    return Promise.resolve(assessRisk(input));
  }
}
