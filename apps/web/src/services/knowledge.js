import { db } from '../db/db';

export async function searchKnowledge(query, language = 'en') {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const docs = await db.knowledge.where('language').equals(language).toArray();
  return docs
    .map((d) => ({
      ...d,
      score: terms.reduce((n, t) => n + (((d.keywords || []).some((k) => String(k).toLowerCase().includes(t)) || String(d.content || '').toLowerCase().includes(t)) ? 1 : 0), 0),
    }))
    .filter((x) => x.score > 0)
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
