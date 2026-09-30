const criticalPatterns = [
  /unconscious/i,
  /cannot breathe/i,
  /can't breathe/i,
  /severe breathing/i,
  /blue lips/i,
  /heavy bleeding/i,
  /chest pain/i,
  /convulsion/i,
  /seizure/i,\n  /மூச்சுத்திணறல்|நினைவிழப்பு|மார்பு வலி|வலிப்பு|கடுமையான இரத்தப்போக்கு/i,\n  /सांस लेने में कठिनाई|बेहोशी|सीने में दर्द|दौरा|भारी रक्तस्राव/i,
];

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
