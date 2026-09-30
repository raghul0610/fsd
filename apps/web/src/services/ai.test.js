import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalAIProvider } from './ai';

vi.mock('./knowledge', () => ({
  searchKnowledge: vi.fn().mockResolvedValue([
    {
      id: 'k-fever',
      title: 'Fever basics',
      source: 'Demo source',
      content: 'Rest and maintain adequate fluids.',
    },
  ]),
}));

describe('LocalAIProvider', () => {
  const provider = new LocalAIProvider();

  beforeEach(() => vi.clearAllMocks());

  it('handles greetings instead of returning health content', async () => {
    await expect(provider.answer('hello')).resolves.toMatchObject({ context: 'conversation' });
  });

  it('answers from the latest assessment', async () => {
    const result = await provider.answer('what is my assessment result?', {
      assessments: [{
        risk: 'MODERATE',
        symptoms: 'fever',
        severity: 3,
        durationDays: 2,
        reason: 'Needs monitoring.',
      }],
    });
    expect(result.context).toBe('assessment');
    expect(result.text).toContain('MODERATE');
    expect(result.text).toContain('fever');
  });

  it('answers from stored history', async () => {
    const result = await provider.answer('show my previous history', {
      assessments: [{
        risk: 'LOW',
        symptoms: 'mild fever',
        severity: 1,
        durationDays: 1,
        reason: 'No critical rule was triggered.',
      }],
      conversations: [{ title: 'Fever basics' }],
    });
    expect(result.context).toBe('history');
    expect(result.text).toContain('mild fever');
    expect(result.text).toContain('Fever basics');
  });

  it('returns topic-specific local knowledge', async () => {
    const result = await provider.answer('what should I know about fever?');
    expect(result.context).toBe('knowledge');
    expect(result.text).toContain('adequate fluids');
  });
});
