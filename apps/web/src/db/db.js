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

export async function seedLocal() {
  const knowledgeCount = await db.knowledge.count();
  if (!knowledgeCount) {
    await db.knowledge.bulkAdd([
      { id: 'k-fever', title: 'Fever basics', category: 'General', language: 'en', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['fever', 'temperature', 'fluids'], content: 'For a mild fever, rest and maintain adequate fluids. Seek professional care when symptoms are severe, persistent, or worsening.' },
      { id: 'k-danger', title: 'Urgent warning signs', category: 'Emergency', language: 'en', source: 'Demonstration safety content', verifiedAt: '2026-09-01', keywords: ['breathing', 'unconscious', 'severe', 'chest pain'], content: 'Severe breathing difficulty, loss of consciousness, severe chest pain, or rapidly worsening symptoms require urgent professional or emergency care.' },
      { id: 'k-prevention', title: 'Prevention basics', category: 'Prevention', language: 'en', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['water', 'hygiene', 'hands'], content: 'Use safe drinking water, maintain hand hygiene, and seek professional guidance for persistent or concerning symptoms.' },
      { id: 'k-dehydration', title: 'Dehydration awareness', category: 'General', language: 'en', source: 'Demonstration curated content', verifiedAt: '2026-09-01', keywords: ['dehydration', 'water', 'thirst', 'urine'], content: 'Keep fluids available and seek professional advice if dehydration symptoms are significant, persistent, or accompanied by severe weakness or confusion.' },
    ]);
  }

  if (!(await db.facilities.count())) {
    await db.facilities.bulkAdd([
      { id: 'f-phc-1', name: 'Demo Primary Health Centre', type: 'PHC', location: 'Local demonstration directory', contact: 'Verify locally', hours: 'Verify locally' },
      { id: 'f-clinic-1', name: 'Demo Community Clinic', type: 'Clinic', location: 'Local demonstration directory', contact: 'Verify locally', hours: 'Verify locally' },
    ]);
  }

  if (!(await db.workers.count())) {
    await db.workers.bulkAdd([
      { id: 'w-asha-1', name: 'Demo Community Health Worker', role: 'ASHA', facility: 'Demo Primary Health Centre', contact: 'Verify locally', language: 'en' },
    ]);
  }
}