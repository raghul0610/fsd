import { db } from '../db/db';

const QUERY_ALIASES = {
  en: {
    fever: ['fever', 'temperature', 'hot', 'high temperature', 'body heat', 'febrile'],
    fluids: ['water', 'fluid', 'fluids', 'hydration', 'drink', 'drinking', 'dehydration'],
    prevention: ['prevention', 'prevent', 'avoid', 'hygiene', 'clean', 'hands', 'safe water'],
    breathing: ['breathing', 'breathe', 'breathless', 'shortness of breath', 'difficulty breathing', 'cannot breathe', "can't breathe"],
    emergency: ['emergency', 'urgent', 'danger', 'severe', 'hospital', 'ambulance'],
    chest: ['chest', 'chest pain'],
    bleeding: ['bleeding', 'blood loss', 'heavy bleeding'],
  },
  ta: {
    fever: ['காய்ச்சல்', 'சூடு', 'வெப்பநிலை'],
    fluids: ['தண்ணீர்', 'திரவம்', 'திரவங்கள்', 'நீர்ச்சத்து', 'குடிக்க'],
    prevention: ['தடுப்பு', 'தடுக்க', 'சுகாதாரம்', 'கைகள்', 'பாதுகாப்பான குடிநீர்'],
    breathing: ['மூச்சு', 'மூச்சுத்திணறல்', 'மூச்சு சிரமம்'],
    emergency: ['அவசரம்', 'அவசர நிலை', 'மருத்துவமனை', 'ஆம்புலன்ஸ்', 'கடுமையான'],
    chest: ['மார்பு', 'மார்பு வலி'],
    bleeding: ['இரத்தப்போக்கு', 'அதிக இரத்தப்போக்கு'],
  },
  hi: {
    fever: ['बुखार', 'तापमान', 'गर्मी'],
    fluids: ['पानी', 'तरल', 'तरल पदार्थ', 'हाइड्रेशन', 'पीना'],
    prevention: ['बचाव', 'रोकथाम', 'स्वच्छता', 'हाथ', 'सुरक्षित पानी'],
    breathing: ['सांस', 'सांस लेने में कठिनाई', 'सांस नहीं', 'दम घुटना'],
    emergency: ['आपातकाल', 'आपात', 'अस्पताल', 'एम्बुलेंस', 'गंभीर'],
    chest: ['सीना', 'सीने में दर्द'],
    bleeding: ['खून', 'रक्तस्राव', 'भारी रक्तस्राव'],
  },
};

function normalize(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[?!,.;:()[\]{}"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandTerms(query, language) {
  const normalized = normalize(query);
  const terms = new Set(normalized.split(/\s+/).filter(Boolean));
  const aliases = QUERY_ALIASES[language] || QUERY_ALIASES.en;

  for (const group of Object.values(aliases)) {
    if (group.some((alias) => normalized.includes(normalize(alias)))) {
      group.forEach((alias) => terms.add(normalize(alias)));
    }
  }

  return [...terms];
}

function scoreDocument(document, terms) {
  const keywords = (document.keywords || []).map(normalize);
  const content = normalize(document.content || '');
  const title = normalize(document.title || '');

  return terms.reduce((score, term) => {
    if (keywords.some((keyword) => keyword === term)) return score + 4;
    if (keywords.some((keyword) => keyword.includes(term) || term.includes(keyword))) return score + 2;
    if (title.includes(term)) return score + 3;
    if (content.includes(term)) return score + 1;
    return score;
  }, 0);
}

export async function searchKnowledge(query, language = 'en') {
  const docs = await db.knowledge.where('language').equals(language).toArray();
  const terms = expandTerms(query, language);

  return docs
    .map((document) => ({ ...document, score: scoreDocument(document, terms) }))
    .filter((document) => document.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export class LocalKnowledgeRetriever {
  search(q, options = {}) {
    return searchKnowledge(q, options.language || 'en');
  }
}

export class CloudKnowledgeRetriever {
  async search() {
    throw new Error('Cloud retrieval is not configured in the offline MVP');
  }
}