import { describe, it, expect } from 'vitest';
import { assessRisk, parseAssessmentInput, TriageEngine } from './triage';

describe('triage', () => {
  it('parses natural English assessment input', () => {
    expect(parseAssessmentInput('I have fever and headache for 3 days, severity 4')).toMatchObject({
      durationDays: 3,
      severity: 4,
      symptoms: 'I have fever and headache for 3 days, severity 4',
    });
  });

  it('parses weeks and multilingual severity', () => {
    expect(parseAssessmentInput('காய்ச்சல் 2 நாட்கள், கடுமையான', 'ta')).toMatchObject({
      durationDays: 2,
      severity: 5,
    });
    expect(parseAssessmentInput('बुखार 2 सप्ताह, मध्यम', 'hi')).toMatchObject({
      durationDays: 14,
      severity: 3,
    });
  });

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
