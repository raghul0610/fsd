import { searchKnowledge } from './knowledge';

export class LocalAIProvider {
  async answer(question, { language = 'en' } = {}) {
    const documents = await searchKnowledge(question, language);
    if (!documents.length) {
      return {
        text: 'No matching local information was found. Try different terms or seek professional healthcare advice.',
        sources: [],
      };
    }
    return {
      text: documents.map((document) => `${document.content}\nSource: ${document.source}`).join('\n\n'),
      sources: documents.map((document) => document.id),
    };
  }
}

export class CloudAIProvider {
  async answer() {
    throw new Error('Cloud AI is intentionally disabled in the offline core. Configure a reviewed provider before enabling it.');
  }
}

export function createAIProvider(mode = 'local') {
  return mode === 'cloud' ? new CloudAIProvider() : new LocalAIProvider();
}