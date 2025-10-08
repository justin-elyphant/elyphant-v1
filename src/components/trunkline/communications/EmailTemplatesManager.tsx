import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Eye, Copy, Trash2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmailTemplateEditor from "./EmailTemplateEditor";
import EmailPreviewModal from "./EmailPreviewModal";
import TestEmailModal from "./TestEmailModal";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  subject_template: string;
  html_template: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface EmailTemplateVariable {
  id: string;
  template_id: string;
  variable_name: string;
  variable_type: string;
  default_value: string;
  is_required: boolean;
  description: string;
}

const EmailTemplatesManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [variables, setVariables] = useState<Record<string, EmailTemplateVariable[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');

      if (templatesError) throw templatesError;

      const { data: variablesData, error: variablesError } = await supabase
        .from('email_template_variables')
        .select('*');

      if (variablesError) throw variablesError;

      setTemplates(templatesData || []);
      
      // Group variables by template_id
      const variablesByTemplate = (variablesData || []).reduce((acc: Record<string, EmailTemplateVariable[]>, variable: EmailTemplateVariable) => {
        if (!acc[variable.template_id]) {
          acc[variable.template_id] = [];
        }
        acc[variable.template_id].push(variable);
        return acc;
      }, {});
      
      setVariables(variablesByTemplate);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.template_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsEditing(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handlePreviewTemplate = async (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
    
    // Fetch the rendered HTML from the template renderer
    try {
      const { data, error } = await supabase.functions.invoke('render-email-template', {
        body: { template_type: template.template_type }
      });

      if (error) throw error;
      
      if (data?.html) {
        setSelectedTemplate({ ...template, html_template: data.html });
      }
    } catch (error: any) {
      console.error('Error rendering template preview:', error);
      // Fall back to stored HTML if rendering fails
    }
  };

  const handleTestTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowTestModal(true);
  };

  const handleSaveTemplate = async (templateData: Partial<EmailTemplate>) => {
    try {
      if (selectedTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Ensure required fields are present for new templates
        const completeTemplateData = {
          name: templateData.name || '',
          template_type: templateData.template_type || '',
          subject_template: templateData.subject_template || '',
          html_template: templateData.html_template || '',
          ...templateData
        };
        
        const { error } = await supabase
          .from('email_templates')
          .insert(completeTemplateData);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      setIsEditing(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      toast.success(`Template ${template.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error toggling template:', error);
      toast.error('Failed to update template status');
    }
  };

  const handleInitializeTemplates = async () => {
    setIsInitializing(true);
    try {
      const { error } = await supabase.functions.invoke('setup-email-templates', {
        headers: {
          'x-setup-token': 'elyphant-email-setup-2025'
        }
      });

      if (error) throw error;

      toast.success('Email templates initialized successfully! 🎉');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error initializing templates:', error);
      toast.error(error.message || 'Failed to initialize templates');
    } finally {
      setIsInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
          <p className="text-slate-600">Manage email templates with professional Elyphant branding</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-3 w-24 rounded" style={{ background: 'linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%)' }}></div>
            <span className="text-xs text-slate-500">Gradient branding applied to all emails</span>
          </div>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button 
              onClick={handleInitializeTemplates} 
              disabled={isInitializing}
              variant="outline"
              className="gap-2 border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4" />
              {isInitializing ? 'Initializing...' : 'Initialize Email Templates'}
            </Button>
          )}
          <Button onClick={handleCreateTemplate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="text-slate-600">
          {filteredTemplates.length} templates
        </Badge>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({templates.filter(t => t.is_active).length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({templates.filter(t => !t.is_active).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {template.name}
                        <Badge 
                          variant={template.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {template.description || `Template for ${template.template_type}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {template.template_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      v{template.version}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-sm text-slate-600">
                      <strong>Subject:</strong> {template.subject_template.substring(0, 50)}
                      {template.subject_template.length > 50 && "..."}
                    </div>
                    
                    {variables[template.id] && (
                      <div className="text-sm text-slate-600">
                        <strong>Variables:</strong> {variables[template.id].length} defined
                      </div>
                    )}
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewTemplate(template)}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTemplate(template)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestTemplate(template)}
                        className="gap-1"
                      >
                        <Send className="h-3 w-3" />
                        Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.filter(t => t.is_active).map((template) => (
              <Card key={template.id} className="group hover:shadow-md transition-shadow">
                {/* Same card content as above */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.filter(t => !t.is_active).map((template) => (
              <Card key={template.id} className="group hover:shadow-md transition-shadow opacity-60">
                {/* Same card content as above */}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {isEditing && (
        <EmailTemplateEditor
          template={selectedTemplate}
          variables={selectedTemplate ? variables[selectedTemplate.id] || [] : []}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setIsEditing(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {showPreview && selectedTemplate && (
        <EmailPreviewModal
          template={selectedTemplate}
          variables={variables[selectedTemplate.id] || []}
          onClose={() => {
            setShowPreview(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {showTestModal && selectedTemplate && (
        <TestEmailModal
          template={selectedTemplate}
          variables={variables[selectedTemplate.id] || []}
          onClose={() => {
            setShowTestModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};

export default EmailTemplatesManager;