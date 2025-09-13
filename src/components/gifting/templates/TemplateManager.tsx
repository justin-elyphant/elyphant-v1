import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, Gift, Calendar, Users, Zap, Copy } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import GiftTemplateCreator from './GiftTemplateCreator';

interface GiftTemplate {
  id: string;
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
  created_at: string;
  usage_count: number;
  last_used: string | null;
}

interface TemplateManagerProps {
  onTemplateSelect?: (template: GiftTemplate) => void;
  showCreateButton?: boolean;
  mode?: 'selection' | 'management';
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  onTemplateSelect,
  showCreateButton = true,
  mode = 'management'
}) => {
  const { profile } = useProfile();
  const [templates, setTemplates] = useState<GiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GiftTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [profile]);

  const fetchTemplates = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('gift_templates')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast JSON fields to proper types
      const formattedTemplates = (data || []).map(template => ({
        ...template,
        budget_range: template.budget_range as any,
        connection_filters: template.connection_filters as any,
        recurring_schedule: template.recurring_schedule as any,
        recipient_types: Array.isArray(template.recipient_types) ? template.recipient_types : [],
        preferred_categories: Array.isArray(template.preferred_categories) ? template.preferred_categories : []
      })) as GiftTemplate[];
      setTemplates(formattedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('gift_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template: GiftTemplate) => {
    try {
      const { id, created_at, usage_count, last_used, ...templateData } = template;
      
      const { data, error } = await supabase
        .from('gift_templates')
        .insert({
          ...templateData,
          user_id: profile?.id,
          name: `${template.name} (Copy)`,
          usage_count: 0,
          last_used: null
        })
        .select()
        .single();

      if (error) throw error;

      // Cast JSON fields for the new template
      const formattedTemplate = {
        ...data,
        budget_range: data.budget_range as any,
        connection_filters: data.connection_filters as any,
        recurring_schedule: data.recurring_schedule as any,
        recipient_types: Array.isArray(data.recipient_types) ? data.recipient_types : [],
        preferred_categories: Array.isArray(data.preferred_categories) ? data.preferred_categories : []
      } as GiftTemplate;
      setTemplates(prev => [formattedTemplate, ...prev]);
      toast.success('Template duplicated successfully');
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleUseTemplate = async (template: GiftTemplate) => {
    try {
      // Update usage statistics
      const { error } = await supabase
        .from('gift_templates')
        .update({
          usage_count: (template.usage_count || 0) + 1,
          last_used: new Date().toISOString()
        })
        .eq('id', template.id);

      if (error) throw error;

      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === template.id 
          ? { ...t, usage_count: (t.usage_count || 0) + 1, last_used: new Date().toISOString() }
          : t
      ));

      if (onTemplateSelect) {
        onTemplateSelect(template);
      }

      toast.success(`Using template: ${template.name}`);
    } catch (error) {
      console.error('Error using template:', error);
      toast.error('Failed to use template');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOccasion = !selectedOccasion || template.occasion === selectedOccasion;
    return matchesSearch && matchesOccasion;
  });

  const occasions = [...new Set(templates.map(t => t.occasion))];

  const TemplateCard = ({ template }: { template: GiftTemplate }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {template.description}
            </p>
          </div>
          <Badge variant="outline" className="ml-2">
            {template.occasion}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4" />
            <span>${template.budget_range.min} - ${template.budget_range.max}</span>
          </div>
          
          {template.recipient_types.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <div className="flex flex-wrap gap-1">
                {template.recipient_types.slice(0, 3).map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
                {template.recipient_types.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.recipient_types.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {template.preferred_categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.preferred_categories.slice(0, 4).map(category => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          )}

          {template.usage_count > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              <span>Used {template.usage_count} times</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => handleUseTemplate(template)}
            className="flex-1"
          >
            Use Template
          </Button>
          
          {mode === 'management' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingTemplate(template)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDuplicateTemplate(template)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteTemplate(template.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gift Templates</h2>
        {showCreateButton && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
              </DialogHeader>
              <GiftTemplateCreator
                onTemplateCreated={(template) => {
                  fetchTemplates();
                  setCreateDialogOpen(false);
                }}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedOccasion}
          onChange={(e) => setSelectedOccasion(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Occasions</option>
          {occasions.map(occasion => (
            <option key={occasion} value={occasion}>
              {occasion}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first gift template to streamline your gifting process
          </p>
          {showCreateButton && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
            </DialogHeader>
            <GiftTemplateCreator
              editingTemplate={editingTemplate}
              onTemplateCreated={() => {
                fetchTemplates();
                setEditingTemplate(null);
              }}
              onCancel={() => setEditingTemplate(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TemplateManager;