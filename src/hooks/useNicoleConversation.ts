
import { useState, useCallback } from "react";
import { getQuestionTemplate, generateFollowUpQuestion } from "@/services/ai/conversationTemplates";

export interface ConversationMessage {
  type: "nicole" | "user" | "options";
  content: string;
  options?: string[];
  timestamp: Date;
}

export interface ConversationContext {
  recipient?: string;
  relationship?: string;
  occasion?: string;
  budget?: [number, number];
  interests?: string[];
  personalityTraits?: string[];
  giftHistory?: string[];
}

export type ConversationStep = "greeting" | "recipient" | "occasion" | "budget" | "interests" | "complete";

export const useNicoleConversation = () => {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<ConversationStep>("greeting");
  const [context, setContext] = useState<ConversationContext>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const addMessage = useCallback((message: ConversationMessage) => {
    setConversation(prev => [...prev, message]);
  }, []);

  const askQuestion = useCallback(async (initialQuery?: string) => {
    setIsGenerating(true);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let question = "";
      let options: string[] = [];
      
      if (initialQuery) {
        // Analyze initial query and ask relevant follow-up
        const analysis = analyzeInitialQuery(initialQuery);
        setContext(prev => ({ ...prev, ...analysis }));
        
        if (!analysis.recipient) {
          question = "Great! Who are you shopping for?";
          options = ["My partner", "Family member", "Friend", "Coworker", "Someone else"];
          setCurrentStep("recipient");
        } else if (!analysis.occasion) {
          question = `Perfect! What's the occasion for ${analysis.recipient}?`;
          options = ["Birthday", "Holiday/Christmas", "Anniversary", "Just because", "Other"];
          setCurrentStep("occasion");
        } else {
          question = "What's your budget range for this gift?";
          options = ["Under $25", "$25-$50", "$50-$100", "$100-$200", "Over $200"];
          setCurrentStep("budget");
        }
      } else {
        question = "Hi! I'm Nicole. Let me help you find the perfect gift. Who are you shopping for?";
        options = ["My partner", "Family member", "Friend", "Coworker", "Someone else"];
        setCurrentStep("recipient");
      }
      
      addMessage({
        type: "nicole",
        content: question,
        timestamp: new Date()
      });
      
      if (options.length > 0) {
        addMessage({
          type: "options",
          content: "",
          options,
          timestamp: new Date()
        });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [addMessage]);

  const respondToQuestion = useCallback(async (response: string) => {
    // Add user response
    addMessage({
      type: "user",
      content: response,
      timestamp: new Date()
    });

    setIsGenerating(true);

    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 600));

      let nextQuestion = "";
      let options: string[] = [];
      let newContext = { ...context };

      switch (currentStep) {
        case "recipient":
          newContext.recipient = response;
          nextQuestion = `Great choice! What's the occasion for ${response.toLowerCase()}?`;
          options = ["Birthday", "Holiday/Christmas", "Anniversary", "Just because", "Other"];
          setCurrentStep("occasion");
          break;
          
        case "occasion":
          newContext.occasion = response;
          nextQuestion = "What's your budget range for this gift?";
          options = ["Under $25", "$25-$50", "$50-$100", "$100-$200", "Over $200"];
          setCurrentStep("budget");
          break;
          
        case "budget":
          newContext.budget = parseBudgetResponse(response);
          nextQuestion = `Perfect! What are ${newContext.recipient}'s interests or hobbies?`;
          options = ["Tech & Gadgets", "Fashion & Style", "Home & Decor", "Sports & Fitness", "Arts & Crafts", "Books & Learning"];
          setCurrentStep("interests");
          break;
          
        case "interests":
          newContext.interests = [response];
          nextQuestion = "Excellent! I have everything I need to find perfect gifts. Ready to see some recommendations?";
          setCurrentStep("complete");
          break;
      }

      setContext(newContext);

      if (nextQuestion) {
        addMessage({
          type: "nicole",
          content: nextQuestion,
          timestamp: new Date()
        });
        
        if (options.length > 0) {
          addMessage({
            type: "options",
            content: "",
            options,
            timestamp: new Date()
          });
        }
      }
    } finally {
      setIsGenerating(false);
    }
  }, [currentStep, context, addMessage]);

  const generateSearchQuery = useCallback(async (): Promise<string> => {
    const { recipient, occasion, budget, interests } = context;
    
    let query = "gifts";
    
    if (recipient) query += ` for ${recipient}`;
    if (occasion) query += ` ${occasion}`;
    if (interests && interests.length > 0) query += ` ${interests[0]}`;
    if (budget) {
      const [min, max] = budget;
      if (max < 100) query += ` under $${max}`;
    }
    
    return query;
  }, [context]);

  const resetConversation = useCallback(() => {
    setConversation([]);
    setCurrentStep("greeting");
    setContext({});
    setIsGenerating(false);
  }, []);

  return {
    conversation,
    currentStep,
    context,
    isGenerating,
    askQuestion,
    respondToQuestion,
    generateSearchQuery,
    resetConversation
  };
};

// Helper functions
function analyzeInitialQuery(query: string): Partial<ConversationContext> {
  const lowerQuery = query.toLowerCase();
  const context: Partial<ConversationContext> = {};
  
  // Extract recipient
  if (lowerQuery.includes("mom") || lowerQuery.includes("mother")) {
    context.recipient = "Mom";
  } else if (lowerQuery.includes("dad") || lowerQuery.includes("father")) {
    context.recipient = "Dad";
  } else if (lowerQuery.includes("wife") || lowerQuery.includes("girlfriend")) {
    context.recipient = "My partner";
  } else if (lowerQuery.includes("friend")) {
    context.recipient = "Friend";
  }
  
  // Extract occasion
  if (lowerQuery.includes("birthday")) {
    context.occasion = "Birthday";
  } else if (lowerQuery.includes("christmas") || lowerQuery.includes("holiday")) {
    context.occasion = "Holiday/Christmas";
  } else if (lowerQuery.includes("anniversary")) {
    context.occasion = "Anniversary";
  }
  
  return context;
}

function parseBudgetResponse(response: string): [number, number] {
  const lower = response.toLowerCase();
  
  if (lower.includes("under $25")) return [0, 25];
  if (lower.includes("$25-$50")) return [25, 50];
  if (lower.includes("$50-$100")) return [50, 100];
  if (lower.includes("$100-$200")) return [100, 200];
  if (lower.includes("over $200")) return [200, 1000];
  
  return [0, 100]; // default
}
