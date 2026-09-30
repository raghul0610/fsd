import 'dotenv/config';
import mongoose from 'mongoose';
import { KnowledgeDocument, HealthcareFacility, HealthcareWorker } from './models/index.js';

const knowledge = [
  { id: 'k-fever', title: 'Fever basics', category: 'General', language: 'en', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['fever', 'temperature', 'fluids'], content: 'For a mild fever, rest and maintain adequate fluids. Seek professional care when symptoms are severe, persistent, or worsening.' },
  { id: 'k-danger', title: 'Urgent warning signs', category: 'Emergency', language: 'en', source: 'Demonstration safety content', verifiedAt: '2026-09-01', keywords: ['breathing', 'unconscious', 'severe', 'chest pain'], content: 'Severe breathing difficulty, loss of consciousness, severe chest pain, or rapidly worsening symptoms require urgent professional or emergency care.' },
  { id: 'k-prevention', title: 'Prevention basics', category: 'Prevention', language: 'en', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['water', 'hygiene', 'hands'], content: 'Use safe drinking water, maintain hand hygiene, and seek professional guidance for persistent or concerning symptoms.' },
];
const facilities = [{ id: 'f-phc-1', name: 'Demo Primary Health Centre', type: 'PHC', location: 'Local demonstration directory', contact: 'Verify locally', hours: 'Verify locally' }];
const workers = [{ id: 'w-asha-1', name: 'Demo Community Health Worker', role: 'ASHA', facility: 'Demo Primary Health Centre', contact: 'Verify locally', language: 'en' }];

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required to seed MongoDB');
await mongoose.connect(process.env.MONGODB_URI);
await Promise.all([
  ...knowledge.map((doc) => KnowledgeDocument.updateOne({ id: doc.id }, doc, { upsert: true })),
  ...facilities.map((doc) => HealthcareFacility.updateOne({ id: doc.id }, doc, { upsert: true })),
  ...workers.map((doc) => HealthcareWorker.updateOne({ id: doc.id }, doc, { upsert: true })),
]);
await mongoose.disconnect();
console.log('Demo data seeded.');