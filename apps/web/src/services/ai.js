import { searchKnowledge } from './knowledge';

function normalize(value = '') {
  return String(value).trim().toLowerCase();
}

function recentAssessmentSummary(assessments = []) {
  if (!assessments.length) return 'There is no assessment history stored on this device yet.';
  return assessments.slice(0, 5).map((item, index) =>
    `${index + 1}. ${item.risk} risk — symptoms: ${item.symptoms}; severity ${item.severity}/5; duration ${item.durationDays} day(s); ${item.reason}`
  ).join('\n');
}

function recentConversationSummary(conversations = []) {
  if (!conversations.length) return 'There is no previous chat history stored on this device yet.';
  return conversations.slice(0, 5).map((item, index) =>
    `${index + 1}. ${item.title || 'Health question'}`
  ).join('\n');
}

function isGreeting(question) {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|how are you)\b/i.test(question);
}

function asksAboutAssessment(question) {
  return /(assessment|assess|risk|symptom check|checkup|my symptoms|what did my test|my result)/i.test(question);
}

function asksAboutHistory(question) {
  return /(history|previous|earlier|last|past|old|conversation|chat|what did i ask|what did we discuss)/i.test(question);
}

function asksForEmergencyHelp(question) {
  return /(emergency|urgent|danger|serious|should i go to hospital|need hospital|can't breathe|cannot breathe|unconscious|heavy bleeding|severe chest pain)/i.test(question);
}

export class LocalAIProvider {
  async answer(question, { language = 'en', assessments = [], conversations = [] } = {}) {
    const normalized = normalize(question);

    if (!normalized) {
      return {
        text: 'Please enter a health question or describe your symptoms.',
        sources: [],
        context: 'empty',
      };
    }

    if (isGreeting(normalized)) {
      return {
        text: 'Hello. I can help you search the saved health information, review your recent assessment history, and explain what is stored on this device. Describe what you need help with.',
        sources: [],
        context: 'conversation',
      };
    }

    if (/^(thanks|thank you|thx|ok|okay|got it|great)\b/i.test(normalized)) {
      return {
        text: 'You’re welcome. If you have another health question, describe the symptom or topic and I’ll check the saved health information.',
        sources: [],
        context: 'conversation',
      };
    }

    if (asksAboutAssessment(normalized)) {
      const latest = assessments[0];
      if (!latest) {
        return {
          text: 'I could not find an assessment on this device yet. Open Check Symptoms, complete an assessment, and I can explain the stored result here.',
          sources: [],
          context: 'assessment',
        };
      }
      return {
        text: `Your latest stored assessment is **${latest.risk}** risk.\n\nSymptoms: ${latest.symptoms}\nSeverity: ${latest.severity}/5\nDuration: ${latest.durationDays} day(s)\nReason: ${latest.reason}\n\nThis is a demonstration triage result, not a diagnosis. If symptoms are severe, worsening, or concerning, seek professional care.`,
        sources: [],
        context: 'assessment',
      };
    }

    if (asksAboutHistory(normalized)) {
      return {
        text: `Here is what is stored locally on this device.\n\nAssessment history:\n${recentAssessmentSummary(assessments)}\n\nRecent chat topics:\n${recentConversationSummary(conversations)}`,
        sources: [],
        context: 'history',
      };
    }

    const documents = await searchKnowledge(question, language);

    if (!documents.length) {
      if (asksForEmergencyHelp(normalized)) {
        return {
          text: 'I do not have enough matching local information to assess this safely. If you may have an emergency or severe/worsening symptoms, seek urgent professional or emergency care now.',
          sources: [],
          context: 'safety',
        };
      }

      return {
        text: 'I could not find a matching topic in the offline health library. Try describing the symptom or topic with a few specific words, or seek professional healthcare advice if you are concerned.',
        sources: [],
        context: 'unknown',
      };
    }

    const primary = documents[0];
    const related = documents.slice(1);
    const relatedText = related.length
      ? `\n\nRelated saved information:\n${related.map((document) => `• ${document.title}: ${document.content}`).join('\n')}`
      : '';

    let contextText = '';
    if (assessments.length) {
      const latest = assessments[0];
      contextText = `\n\nYour latest stored assessment: ${latest.risk} risk, severity ${latest.severity}/5, duration ${latest.durationDays} day(s). This assessment is kept as local context and is not a diagnosis.`;
    }

    return {
      text: `${primary.content}${relatedText}${contextText}\n\nSource: ${primary.source}`,
      sources: documents.map((document) => document.id),
      context: 'knowledge',
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
