
export interface ConversationTemplate {
  trigger: string[];
  initialQuestions: string[];
  followUpLogic: (context: any) => string[];
  requiredFields: ('recipient' | 'occasion' | 'budget' | 'interests')[];
}

export const conversationTemplates: ConversationTemplate[] = [
  {
    trigger: ["birthday", "bday"],
    initialQuestions: [
      "Who's birthday is it?",
      "How old are they turning?",
      "What are their main interests?"
    ],
    followUpLogic: (context) => {
      if (!context.budget) return ["What's your budget for this birthday gift?"];
      if (!context.interests) return ["What does the birthday person enjoy doing?"];
      return [];
    },
    requiredFields: ['recipient', 'occasion', 'budget', 'interests']
  },
  {
    trigger: ["christmas", "holiday", "xmas"],
    initialQuestions: [
      "Who are you shopping for this holiday season?",
      "What's your budget range?",
      "Any specific interests or hobbies they have?"
    ],
    followUpLogic: (context) => {
      if (!context.recipient) return ["Who is this holiday gift for?"];
      if (!context.budget) return ["What's your holiday gift budget?"];
      return [];
    },
    requiredFields: ['recipient', 'budget', 'interests']
  },
  {
    trigger: ["anniversary"],
    initialQuestions: [
      "What kind of anniversary is this?",
      "How long have you been together?",
      "Are you looking for something romantic or practical?"
    ],
    followUpLogic: (context) => {
      if (!context.budget) return ["What's your budget for this anniversary gift?"];
      if (!context.personalityTraits) return ["Would you describe your partner as more sentimental or practical?"];
      return [];
    },
    requiredFields: ['occasion', 'budget']
  }
];

export const getQuestionTemplate = (query: string): ConversationTemplate | null => {
  const lowerQuery = query.toLowerCase();
  
  for (const template of conversationTemplates) {
    if (template.trigger.some(trigger => lowerQuery.includes(trigger))) {
      return template;
    }
  }
  
  return null;
};

export const generateFollowUpQuestion = (context: any, template?: ConversationTemplate): string => {
  if (template && template.followUpLogic) {
    const questions = template.followUpLogic(context);
    if (questions.length > 0) {
      return questions[0];
    }
  }
  
  // Default follow-up questions
  if (!context.recipient) {
    return "Who are you shopping for?";
  }
  if (!context.occasion) {
    return "What's the occasion?";
  }
  if (!context.budget) {
    return "What's your budget range?";
  }
  if (!context.interests) {
    return "What are their main interests or hobbies?";
  }
  
  return "Perfect! I have enough information to help you find great gifts.";
};
