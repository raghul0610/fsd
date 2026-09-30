import Dexie from 'dexie';

export const db = new Dexie('RuralHealthDB');
db.version(3).stores({
  conversations: 'id,updatedAt,deviceId',
  messages: 'id,conversationId,createdAt',
  assessments: 'id,createdAt,risk,deviceId',
  knowledge: 'id,language,category',
  facilities: 'id,name,type',
  workers: 'id,name,role',
  syncQueue: 'id,status,createdAt,entityType,entityId,nextRetryAt',
  appMetadata: 'key',
});

export async function getDeviceId() {
  const existing = await db.appMetadata.get('deviceId');
  if (existing?.value) return existing.value;
  const value = crypto.randomUUID();
  await db.appMetadata.put({ key: 'deviceId', value });
  return value;
}

const LOCAL_KNOWLEDGE = [
  { id: 'k-fever-en', title: 'Fever basics', category: 'General', language: 'en', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['fever', 'temperature', 'fluids'], content: 'For a mild fever, rest and maintain adequate fluids. Seek professional care when symptoms are severe, persistent, or worsening.' },
  { id: 'k-fever-ta', title: 'காய்ச்சல் அடிப்படைகள்', category: 'பொது', language: 'ta', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['காய்ச்சல்', 'வெப்பநிலை', 'தண்ணீர்', 'திரவம்'], content: 'லேசான காய்ச்சல் இருந்தால் ஓய்வெடுத்து போதுமான திரவங்களை எடுத்துக்கொள்ளுங்கள். அறிகுறிகள் தீவிரமாகவோ தொடர்ந்து நீடித்தாலோ அல்லது மோசமடைந்தாலோ மருத்துவ நிபுணரை அணுகுங்கள்.' },
  { id: 'k-fever-hi', title: 'बुखार की मूल जानकारी', category: 'सामान्य', language: 'hi', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['बुखार', 'तापमान', 'पानी', 'तरल'], content: 'हल्का बुखार होने पर आराम करें और पर्याप्त तरल लें। लक्षण गंभीर, लगातार या बिगड़ते रहें तो स्वास्थ्य पेशेवर से सलाह लें।' },
  { id: 'k-danger-en', title: 'Urgent warning signs', category: 'Emergency', language: 'en', source: 'Demonstration safety content', verifiedAt: '2026-09-01', keywords: ['breathing', 'unconscious', 'severe', 'chest pain'], content: 'Severe breathing difficulty, loss of consciousness, severe chest pain, or rapidly worsening symptoms require urgent professional or emergency care.' },
  { id: 'k-danger-ta', title: 'அவசர எச்சரிக்கை அறிகுறிகள்', category: 'அவசரம்', language: 'ta', source: 'Demonstration safety content', verifiedAt: '2026-09-01', keywords: ['மூச்சு', 'நினைவிழப்பு', 'தீவிரம்', 'மார்பு வலி'], content: 'கடுமையான மூச்சுத்திணறல், நினைவிழப்பு, கடுமையான மார்பு வலி அல்லது வேகமாக மோசமடையும் அறிகுறிகள் இருந்தால் உடனடி மருத்துவ அல்லது அவசர சிகிச்சையைப் பெறுங்கள்.' },
  { id: 'k-danger-hi', title: 'आपातकालीन चेतावनी संकेत', category: 'आपातकाल', language: 'hi', source: 'Demonstration safety content', verifiedAt: '2026-09-01', keywords: ['सांस', 'बेहोशी', 'गंभीर', 'सीने में दर्द'], content: 'गंभीर सांस लेने में कठिनाई, बेहोशी, तेज सीने का दर्द या तेजी से बिगड़ते लक्षण होने पर तुरंत पेशेवर या आपातकालीन चिकित्सा सहायता लें।' },
  { id: 'k-prevention-en', title: 'Prevention basics', category: 'Prevention', language: 'en', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['water', 'hygiene', 'hands'], content: 'Use safe drinking water, maintain hand hygiene, and seek professional guidance for persistent or concerning symptoms.' },
  { id: 'k-prevention-ta', title: 'தடுப்பு அடிப்படைகள்', category: 'தடுப்பு', language: 'ta', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['தண்ணீர்', 'சுகாதாரம்', 'கைகள்'], content: 'பாதுகாப்பான குடிநீரைப் பயன்படுத்துங்கள், கைகளின் சுகாதாரத்தைப் பேணுங்கள், தொடர்ந்து நீடிக்கும் அல்லது கவலைக்குரிய அறிகுறிகளுக்கு மருத்துவ ஆலோசனை பெறுங்கள்.' },
  { id: 'k-prevention-hi', title: 'बचाव की मूल बातें', category: 'रोकथाम', language: 'hi', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['पानी', 'स्वच्छता', 'हाथ'], content: 'सुरक्षित पीने का पानी इस्तेमाल करें, हाथों की स्वच्छता बनाए रखें और लगातार या चिंताजनक लक्षणों के लिए स्वास्थ्य पेशेवर से सलाह लें।' },
];

const LOCAL_FACILITIES = [
  { id: 'f-phc-1', name: 'Demo Primary Health Centre', type: 'PHC', location: 'Local demonstration directory', contact: 'Verify locally', hours: 'Verify locally' },
  { id: 'f-clinic-1', name: 'Demo Community Clinic', type: 'Clinic', location: 'Local demonstration directory', contact: 'Verify locally', hours: 'Verify locally' },
];

const LOCAL_WORKERS = [
  { id: 'w-asha-1', name: 'Demo Community Health Worker', role: 'ASHA', facility: 'Demo Primary Health Centre', contact: 'Verify locally', language: 'en' },
];

export async function seedLocal() {
  await db.knowledge.bulkPut(LOCAL_KNOWLEDGE);
  if (!(await db.facilities.count())) await db.facilities.bulkAdd(LOCAL_FACILITIES);
  if (!(await db.workers.count())) await db.workers.bulkAdd(LOCAL_WORKERS);
}
