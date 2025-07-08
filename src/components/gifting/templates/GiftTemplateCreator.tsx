import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Wand2, Calendar, Users, Gift, Plus, X } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GiftTemplate {
  id?: string;
  name: string;
  description: string;
  occasion: string;
  budget_range: {
    min: number;
    max: number;
  };
  recipient_types: string[];
  preferred_categories: string[];
  default_message: string;
  recurring_schedule?: {
    enabled: boolean;
    frequency: 'yearly' | 'monthly' | 'custom';
    days_before: number;
  };
  connection_filters?: {
    relationship_types: string[];
    min_connection_age: number;
  };
}

interface GiftTemplateCreatorProps {
  onTemplateCreated: (template: GiftTemplate) => void;
  editingTemplate?: GiftTemplate;
  onCancel?: () => void;
}

const GiftTemplateCreator: React.FC<GiftTemplateCreatorProps> = ({
  onTemplateCreated,
  editingTemplate,
  onCancel
}) => {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<GiftTemplate>({
    name: '',
    description: '',
    occasion: '',
    budget_range: { min: 25, max: 100 },
    recipient_types: [],
    preferred_categories: [],
    default_message: '',
    recurring_schedule: {
      enabled: false,
      frequency: 'yearly',
      days_before: 7
    },
    connection_filters: {
      relationship_types: [],
      min_connection_age: 0
    }
  });

  const occasions = [
    'Birthday', 'Anniversary', 'Holiday', 'Graduation', 'Wedding', 
    'New Baby', 'Housewarming', 'Thank You', 'Congratulations', 'Just Because'
  ];

  const categories = [
    'Electronics', 'Books', 'Home & Garden', 'Fashion', 'Sports & Outdoors',
    'Beauty & Personal Care', 'Toys & Games', 'Food & Beverages', 'Art & Crafts',
    'Music & Movies', 'Travel', 'Health & Wellness'
  ];

  const relationshipTypes = ['friend', 'family', 'colleague', 'partner', 'acquaintance'];

  useEffect(() => {
    if (editingTemplate) {
      setTemplate(editingTemplate);
    }
  }, [editingTemplate]);

  const handleSaveTemplate = async () => {
    if (!profile || !template.name || !template.occasion) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        user_id: profile.id,
        name: template.name,
        description: template.description,
        occasion: template.occasion,
        budget_range: template.budget_range,
        recipient_types: template.recipient_types,
        preferred_categories: template.preferred_categories,
        default_message: template.default_message,
        recurring_schedule: template.recurring_schedule,
        connection_filters: template.connection_filters,
        is_active: true
      };

      if (editingTemplate?.id) {
        const { error } = await supabase
          .from('gift_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const { data, error } = await supabase
          .from('gift_templates')
          .insert(templateData)
          .select()
          .single();

        if (error) throw error;
        toast.success('Template created successfully');
        onTemplateCreated({ ...template, id: data.id });
      }

      // Reset form
      setTemplate({
        name: '',
        description: '',
        occasion: '',
        budget_range: { min: 25, max: 100 },
        recipient_types: [],
        preferred_categories: [],
        default_message: '',
        recurring_schedule: {
          enabled: false,
          frequency: 'yearly',
          days_before: 7
        },
        connection_filters: {
          relationship_types: [],
          min_connection_age: 0
        }
      });

    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const addRecipientType = (type: string) => {
    if (!template.recipient_types.includes(type)) {
      setTemplate(prev => ({
        ...prev,
        recipient_types: [...prev.recipient_types, type]
      }));
    }
  };

  const removeRecipientType = (type: string) => {
    setTemplate(prev => ({
      ...prev,
      recipient_types: prev.recipient_types.filter(t => t !== type)
    }));
  };

  const addCategory = (category: string) => {
    if (!template.preferred_categories.includes(category)) {
      setTemplate(prev => ({
        ...prev,
        preferred_categories: [...prev.preferred_categories, category]
      }));
    }
  };

  const removeCategory = (category: string) => {
    setTemplate(prev => ({
      ...prev,
      preferred_categories: prev.preferred_categories.filter(c => c !== category)
    }));
  };

  const generateSmartSuggestions = () => {
    // Use ProfileContext data to suggest template settings
    const userPreferences = profile?.gift_preferences || [];
    const userInterests = profile?.interests || [];
    
    const suggestedCategories = userInterests.slice(0, 3);
    const suggestedMessage = `Happy ${template.occasion}! Hope you love this gift chosen especially for you.`;
    
    setTemplate(prev => ({
      ...prev,
      preferred_categories: suggestedCategories,
      default_message: suggestedMessage
    }));
    
    toast.success('Smart suggestions applied based on your profile');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          {editingTemplate ? 'Edit Gift Template' : 'Create Gift Template'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={template.name}
              onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Birthday Gifts for Friends"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={template.description}
              onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe when and how this template should be used"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="occasion">Occasion *</Label>
            <Select
              value={template.occasion}
              onValueChange={(value) => setTemplate(prev => ({ ...prev, occasion: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select occasion" />
              </SelectTrigger>
              <SelectContent>
                {occasions.map(occasion => (
                  <SelectItem key={occasion} value={occasion}>
                    {occasion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Budget Range */}
        <div className="space-y-4">
          <Label>Budget Range</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minBudget">Min ($)</Label>
              <Input
                id="minBudget"
                type="number"
                value={template.budget_range.min}
                onChange={(e) => setTemplate(prev => ({
                  ...prev,
                  budget_range: { ...prev.budget_range, min: parseInt(e.target.value) || 0 }
                }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxBudget">Max ($)</Label>
              <Input
                id="maxBudget"
                type="number"
                value={template.budget_range.max}
                onChange={(e) => setTemplate(prev => ({
                  ...prev,
                  budget_range: { ...prev.budget_range, max: parseInt(e.target.value) || 0 }
                }))}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Recipient Types */}
        <div className="space-y-4">
          <Label>Recipient Types</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {template.recipient_types.map(type => (
              <Badge key={type} variant="secondary" className="flex items-center gap-1">
                {type}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeRecipientType(type)}
                />
              </Badge>
            ))}
          </div>
          <Select onValueChange={addRecipientType}>
            <SelectTrigger>
              <SelectValue placeholder="Add recipient type" />
            </SelectTrigger>
            <SelectContent>
              {relationshipTypes
                .filter(type => !template.recipient_types.includes(type))
                .map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preferred Categories */}
        <div className="space-y-4">
          <Label>Preferred Categories</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {template.preferred_categories.map(category => (
              <Badge key={category} variant="secondary" className="flex items-center gap-1">
                {category}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeCategory(category)}
                />
              </Badge>
            ))}
          </div>
          <Select onValueChange={addCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Add category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter(cat => !template.preferred_categories.includes(cat))
                .map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Default Message */}
        <div>
          <Label htmlFor="defaultMessage">Default Gift Message</Label>
          <Textarea
            id="defaultMessage"
            value={template.default_message}
            onChange={(e) => setTemplate(prev => ({ ...prev, default_message: e.target.value }))}
            placeholder="Enter a default message for gifts from this template"
            className="mt-1"
          />
        </div>

        {/* Smart Suggestions */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={generateSmartSuggestions}
            className="flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Apply Smart Suggestions
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSaveTemplate}
            disabled={loading || !template.name || !template.occasion}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftTemplateCreator;