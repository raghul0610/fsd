const VOICE_LOCALES = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
};

export function getVoiceLocale(language = 'en') {
  return VOICE_LOCALES[language] || VOICE_LOCALES.en;
}

export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startSpeechRecognition({ language = 'en', onResult, onError, onEnd }) {
  if (!isSpeechRecognitionSupported()) {
    onError?.(new Error('Speech recognition is not supported by this browser.'));
    return null;
  }

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Recognition();

  recognition.lang = getVoiceLocale(language);
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
    if (transcript) onResult?.(transcript);
  };
  recognition.onerror = (event) => onError?.(new Error(event.error || 'Speech recognition failed.'));
  recognition.onend = () => onEnd?.();

  recognition.start();
  return recognition;
}

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && Boolean(
    window.speechSynthesis &&
    window.SpeechSynthesisUtterance
  );
}

export function speakText(text, language = 'en') {
  if (!isSpeechSynthesisSupported() || !text?.trim()) return false;

  window.speechSynthesis.cancel();
  const Utterance = window.SpeechSynthesisUtterance;
  const utterance = new Utterance(text.trim());
  utterance.lang = getVoiceLocale(language);
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}