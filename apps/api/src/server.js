import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import pino from 'pino';
import { z } from 'zod';
import {
  UserProfile,
  Conversation,
  Assessment,
  KnowledgeDocument,
  HealthcareFacility,
  HealthcareWorker,
  SyncOperation,
} from './models/index.js';
import { assessRisk } from './services/triage.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();
const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const memory = {
  knowledge: [],
  facilities: [],
  workers: [],
  assessments: new Map(),
  conversations: new Map(),
  sync: new Set(),
  users: new Map(),
};

const demoKnowledge = [
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
const demoFacilities = [{ id: 'f-phc-1', name: 'Demo Primary Health Centre', type: 'PHC', location: 'Local demonstration directory', contact: 'Verify locally', hours: 'Verify locally' }];
const demoWorkers = [{ id: 'w-asha-1', name: 'Demo Community Health Worker', role: 'ASHA', facility: 'Demo Primary Health Centre', contact: 'Verify locally', language: 'en' }];

memory.knowledge.push(...demoKnowledge);
memory.facilities.push(...demoFacilities);
memory.workers.push(...demoWorkers);

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const deviceSchema = z.string().min(1).max(128);
const assessmentSchema = z.object({
  id: z.string().min(1),
  deviceId: deviceSchema,
  symptoms: z.string().min(1).max(5000),
  severity: z.coerce.number().int().min(1).max(5),
  durationDays: z.coerce.number().int().min(0).max(3650),
  ageGroup: z.string().optional(),
});
const conversationSchema = z.object({
  id: z.string().min(1),
  deviceId: deviceSchema,
  title: z.string().max(200).optional(),
  messages: z.array(z.object({ id: z.string(), role: z.enum(['user', 'assistant']), content: z.string(), createdAt: z.any().optional() })).default([]),
});
const syncSchema = z.object({
  id: z.string().min(1),
  deviceId: deviceSchema,
  entityType: z.enum(['assessment', 'conversation', 'userProfile']),
  entityId: z.string().min(1),
  operation: z.literal('UPSERT'),
  payload: z.record(z.string(), z.any()),
});

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.get('/api/knowledge', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const language = String(req.query.language || 'en');
    const filter = { language };
    let docs = isMongoReady() ? await KnowledgeDocument.find(filter).limit(100).lean() : memory.knowledge.filter((doc) => doc.language === language).slice(0, 100);
    if (q) {
      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      docs = docs.map((doc) => {
        const haystack = `${doc.title} ${doc.content} ${(doc.keywords || []).join(' ')}`.toLowerCase();
        const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
        return { ...doc, score };
      }).filter((doc) => doc.score > 0).sort((a, b) => b.score - a.score).slice(0, 20);
    }
    res.json({ success: true, data: docs });
  } catch (e) { next(e); }
});

app.get('/api/facilities', async (req, res, next) => {
  try { res.json({ success: true, data: isMongoReady() ? await HealthcareFacility.find().limit(100).lean() : memory.facilities }); } catch (e) { next(e); }
});

app.get('/api/workers', async (req, res, next) => {
  try { res.json({ success: true, data: isMongoReady() ? await HealthcareWorker.find().limit(100).lean() : memory.workers }); } catch (e) { next(e); }
});

app.post('/api/assessments', async (req, res, next) => {
  try {
    const data = assessmentSchema.parse(req.body);
    const risk = assessRisk(data);
    const doc = { ...data, ...risk };
    if (isMongoReady()) await Assessment.findOneAndUpdate({ id: data.id }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    else memory.assessments.set(data.id, doc);
    res.json({ success: true, data: doc });
  } catch (e) { next(e); }
});

app.get('/api/conversations', async (req, res, next) => {
  try {
    const deviceId = deviceSchema.parse(String(req.query.deviceId || ''));
    const data = isMongoReady()
      ? await Conversation.find({ deviceId }).sort({ updatedAt: -1 }).limit(100).lean()
      : [...memory.conversations.values()].filter((item) => item.deviceId === deviceId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

app.post('/api/conversations', async (req, res, next) => {
  try {
    const data = conversationSchema.parse(req.body);
    if (isMongoReady()) await Conversation.findOneAndUpdate({ id: data.id }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
    else memory.conversations.set(data.id, data);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

app.get('/api/assessments', async (req, res, next) => {
  try {
    const deviceId = deviceSchema.parse(String(req.query.deviceId || ''));
    const data = isMongoReady() ? await Assessment.find({ deviceId }).sort({ createdAt: -1 }).limit(100).lean() : [...memory.assessments.values()].filter((item) => item.deviceId === deviceId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

app.post('/api/sync', async (req, res, next) => {
  try {
    const sync = syncSchema.parse(req.body);
    const already = isMongoReady() ? await SyncOperation.findOne({ id: sync.id }).lean() : memory.sync.has(sync.id);
    if (already) return res.json({ success: true, duplicate: true, operationId: sync.id });

    if (sync.entityType === 'assessment') {
      const p = assessmentSchema.parse({ ...sync.payload, id: sync.entityId, deviceId: sync.deviceId });
      const risk = assessRisk(p);
      const doc = { ...p, ...risk };
      if (isMongoReady()) await Assessment.findOneAndUpdate({ id: p.id }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
      else memory.assessments.set(p.id, doc);
    } else if (sync.entityType === 'conversation') {
      const p = conversationSchema.parse({ ...sync.payload, id: sync.entityId, deviceId: sync.deviceId });
      if (isMongoReady()) await Conversation.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true, setDefaultsOnInsert: true });
      else memory.conversations.set(p.id, p);
    } else {
      const p = z.object({ name: z.string().max(100).optional(), language: z.string().optional() }).parse(sync.payload);
      if (isMongoReady()) await UserProfile.findOneAndUpdate({ deviceId: sync.deviceId }, { deviceId: sync.deviceId, ...p }, { upsert: true, new: true, setDefaultsOnInsert: true });
      else memory.users.set(sync.deviceId, { deviceId: sync.deviceId, ...p });
    }
    if (isMongoReady()) await SyncOperation.create({ id: sync.id, deviceId: sync.deviceId, entityType: sync.entityType, entityId: sync.entityId, operation: sync.operation });
    else memory.sync.add(sync.id);
    res.json({ success: true, duplicate: false, operationId: sync.id });
  } catch (e) { next(e); }
});

app.use(notFound);
app.use(errorHandler);

const isMongoReady = () => mongoose.connection.readyState === 1;
const port = Number(process.env.PORT || 4000);

export async function start() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    log.info('MongoDB connected');
  } else {
    log.warn('MONGODB_URI not set; API starts for health-only/local frontend development');
  }
  return app.listen(port, () => log.info({ port }, 'API listening'));
}

if (process.env.NODE_ENV !== 'test') start().catch((e) => { log.error(e); process.exit(1); });

export default app;
