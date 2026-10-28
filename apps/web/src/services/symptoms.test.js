import { describe, expect, it } from 'vitest';
import { detectSymptoms, symptomGuidance } from './symptoms';

describe('offline symptom recognition', () => {
  it('recognizes common English symptoms that were missing from the knowledge library', () => {
    expect(detectSymptoms('I have palpitations and fever', 'en').recognized).toEqual(['palpitations', 'fever']);
  });

  it('recognizes supported Tamil and Hindi symptom terms', () => {
    expect(detectSymptoms('எனக்கு காய்ச்சல் மற்றும் தலைவலி', 'ta').recognized).toContain('fever');
    expect(detectSymptoms('मुझे बुखार है', 'hi').recognized).toContain('fever');
  });

  it('flags potential emergency symptoms', () => {
    expect(detectSymptoms('I have chest pain', 'en').emergency).toBe(true);
    expect(detectSymptoms('I have a mild cough', 'en').emergency).toBe(false);
  });

  it('provides PHC/community-health-worker next steps without diagnosing', () => {
    const guidance = symptomGuidance('en', ['fever']);
    expect(guidance).toContain('Primary Health Centre (PHC)');
    expect(guidance).toContain('not a diagnosis');
    expect(guidance).toContain('how long');
  });
});
