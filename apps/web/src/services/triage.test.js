import { describe, it, expect } from 'vitest';
import { assessRisk, TriageEngine } from './triage';

describe('triage', () => {
  it('classifies critical warning signs', () => {
    expect(assessRisk({ symptoms: 'chest pain', severity: 1, durationDays: 1 }).risk).toBe('CRITICAL');
  });
  it('classifies high severity as critical', () => {
    expect(assessRisk({ symptoms: 'fever', severity: 5, durationDays: 1 }).risk).toBe('CRITICAL');
  });
  it('classifies persistent or moderate symptoms', () => {
    expect(assessRisk({ symptoms: 'fever', severity: 3, durationDays: 1 }).risk).toBe('MODERATE');
  });
  it('classifies low-risk input', () => {
    expect(assessRisk({ symptoms: 'mild fever', severity: 1, durationDays: 1 }).risk).toBe('LOW');
  });
  it('exposes the async engine abstraction', async () => {
    await expect(new TriageEngine().assess({ symptoms: 'fever', severity: 1, durationDays: 1 })).resolves.toMatchObject({ risk: 'LOW' });
  });
});