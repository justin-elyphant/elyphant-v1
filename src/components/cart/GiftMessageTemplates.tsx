import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, Gift, Coffee, Star } from 'lucide-react';

interface GiftMessageTemplate {
  id: string;
  text: string;
  category: 'general' | 'birthday' | 'holiday' | 'thankyou' | 'romantic';
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

interface GiftMessageTemplatesProps {
  onSelectTemplate: (message: string) => void;
  recipientName?: string;
}

const templates: GiftMessageTemplate[] = [
  {
    id: 'thinking-of-you',
    text: "Thinking of you! Hope this brings a smile to your face.",
    category: 'general',
    icon: Heart,
    tags: ['caring', 'friendship']
  },
  {
    id: 'enjoy',
    text: "Hope you enjoy this little something!",
    category: 'general',
    icon: Gift,
    tags: ['casual', 'friendly']
  },
  {
    id: 'deserve-it',
    text: "You deserve something special. Enjoy!",
    category: 'thankyou',
    icon: Star,
    tags: ['appreciation', 'recognition']
  },
  {
    id: 'perfect-for-you',
    text: "Saw this and thought it was perfect for you!",
    category: 'general',
    icon: Sparkles,
    tags: ['thoughtful', 'personal']
  },
  {
    id: 'birthday-celebration',
    text: "Hope your special day is as wonderful as you are!",
    category: 'birthday',
    icon: Gift,
    tags: ['birthday', 'celebration']
  },
  {
    id: 'thank-you',
    text: "Thank you for everything you do. You're amazing!",
    category: 'thankyou',
    icon: Heart,
    tags: ['gratitude', 'appreciation']
  },
  {
    id: 'just-because',
    text: "No special reason - just wanted to make your day brighter!",
    category: 'general',
    icon: Sparkles,
    tags: ['spontaneous', 'caring']
  },
  {
    id: 'coffee-lover',
    text: "For all those early mornings and late nights - you've got this!",
    category: 'general',
    icon: Coffee,
    tags: ['coffee', 'encouragement']
  }
];

const GiftMessageTemplates: React.FC<GiftMessageTemplatesProps> = ({
  onSelectTemplate,
  recipientName
}) => {
  const personalizeMessage = (template: string, name?: string) => {
    if (!name) return template;
    
    // Add personalization where appropriate
    if (template.includes("Hope you")) {
      return template.replace("Hope you", `Hope you, ${name},`);
    }
    if (template.includes("You deserve")) {
      return template.replace("You deserve", `${name}, you deserve`);
    }
    if (template.includes("Thank you")) {
      return template.replace("Thank you", `Thank you, ${name},`);
    }
    
    return template;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'birthday': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'holiday': return 'bg-green-100 text-green-700 border-green-200';
      case 'thankyou': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'romantic': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, GiftMessageTemplate[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Quick Message Templates</span>
        {recipientName && (
          <Badge variant="outline" className="text-xs">
            For {recipientName}
          </Badge>
        )}
      </div>

      <div className="space-y-4 max-h-48 overflow-y-auto">
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {category === 'thankyou' ? 'Thank You' : category}
            </h4>
            
            <div className="space-y-2">
              {categoryTemplates.map((template) => {
                const IconComponent = template.icon;
                const personalizedMessage = personalizeMessage(template.text, recipientName);
                
                return (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto min-h-[44px] py-3 px-3 hover:bg-muted/50 touch-manipulation"
                    onClick={() => onSelectTemplate(personalizedMessage)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <IconComponent className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">{personalizedMessage}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getCategoryColor(template.category)}`}
                          >
                            {category}
                          </Badge>
                          {template.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
        💡 Tip: These templates are personalized for {recipientName || 'your recipient'} and optimized for package delivery.
      </div>
    </div>
  );
};

export default GiftMessageTemplates;