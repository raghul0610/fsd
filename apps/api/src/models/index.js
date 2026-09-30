import mongoose from 'mongoose';

const timestamps = { timestamps: true };

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

export const UserProfile = mongoose.model('UserProfile', new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: 'Guest' },
  language: { type: String, default: 'en' },
}, timestamps));

export const Conversation = mongoose.model('Conversation', new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  deviceId: { type: String, required: true, index: true },
  title: { type: String, default: 'Health conversation' },
  messages: { type: [messageSchema], default: [] },
}, timestamps));

export const Assessment = mongoose.model('Assessment', new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  deviceId: { type: String, required: true, index: true },
  symptoms: { type: String, required: true },
  severity: { type: Number, min: 1, max: 5, required: true },
  durationDays: { type: Number, min: 0, required: true },
  ageGroup: { type: String, default: 'adult' },
  risk: { type: String, enum: ['LOW', 'MODERATE', 'CRITICAL'], required: true },
  reason: { type: String, required: true },
}, timestamps));

export const KnowledgeDocument = mongoose.model('KnowledgeDocument', new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  language: { type: String, default: 'en', index: true },
  source: { type: String, required: true },
  verifiedAt: { type: String },
  keywords: { type: [String], default: [] },
  content: { type: String, required: true },
}, timestamps));

export const KnowledgeChunk = mongoose.model('KnowledgeChunk', new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  documentId: { type: String, required: true, index: true },
  content: { type: String, required: true },
  language: { type: String, default: 'en', index: true },
  keywords: { type: [String], default: [] },
}, timestamps));

export const HealthcareFacility = mongoose.model('HealthcareFacility', new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  contact: { type: String },
  hours: { type: String },
}, timestamps));

export const HealthcareWorker = mongoose.model('HealthcareWorker', new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  facility: { type: String },
  contact: { type: String },
  language: { type: String, default: 'en' },
}, timestamps));

export const SyncOperation = mongoose.model('SyncOperation', new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  deviceId: { type: String, required: true, index: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  operation: { type: String, enum: ['UPSERT'], required: true },
  status: { type: String, enum: ['SYNCED'], default: 'SYNCED' },
}, timestamps));