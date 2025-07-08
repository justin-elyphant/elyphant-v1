import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Building, Heart, MapPin, Plus } from 'lucide-react';

interface AddressTemplate {
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface AddressQuickActionsProps {
  onTemplateSelect: (template: AddressTemplate) => void;
  onCustomAdd: () => void;
}

const AddressQuickActions: React.FC<AddressQuickActionsProps> = ({
  onTemplateSelect,
  onCustomAdd
}) => {
  const templates: AddressTemplate[] = [
    {
      name: 'Home',
      icon: <Home className="h-4 w-4" />,
      description: 'Add your home address'
    },
    {
      name: 'Work',
      icon: <Building className="h-4 w-4" />,
      description: 'Add your work address'
    },
    {
      name: 'Family',
      icon: <Heart className="h-4 w-4" />,
      description: 'Add family member address'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-3">
        Quick address templates:
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {templates.map((template) => (
          <Button
            key={template.name}
            variant="outline"
            size="sm"
            onClick={() => onTemplateSelect(template)}
            className="justify-start h-auto p-3"
          >
            <div className="flex items-center gap-2">
              {template.icon}
              <div className="text-left">
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-muted-foreground">
                  {template.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onCustomAdd}
        className="w-full justify-start"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Address
      </Button>
    </div>
  );
};

export default AddressQuickActions;