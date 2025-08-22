import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  subject_template: string;
  html_template: string;
  is_active: boolean;
  version: number;
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

interface EmailTemplateEditorProps {
  template: EmailTemplate | null;
  variables: EmailTemplateVariable[];
  onSave: (templateData: Partial<EmailTemplate>) => Promise<void>;
  onCancel: () => void;
}

const EMAIL_TYPES = [
  'verification',
  'gift_invitation',
  'auto_gift_approval',
  'order_confirmation',
  'gift_delivered',
  'reminder',
  'system_notification'
];

const VARIABLE_TYPES = ['string', 'number', 'boolean', 'date', 'url'];

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  template,
  variables,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: '',
    subject_template: '',
    html_template: '',
    is_active: true
  });

  const [templateVariables, setTemplateVariables] = useState<Partial<EmailTemplateVariable>[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        template_type: template.template_type,
        subject_template: template.subject_template,
        html_template: template.html_template,
        is_active: template.is_active
      });
      setTemplateVariables(variables.map(v => ({ ...v })));
    } else {
      // Reset for new template
      setFormData({
        name: '',
        description: '',
        template_type: '',
        subject_template: '',
        html_template: '',
        is_active: true
      });
      setTemplateVariables([]);
    }
  }, [template, variables]);

  const handleAddVariable = () => {
    setTemplateVariables([...templateVariables, {
      variable_name: '',
      variable_type: 'string',
      default_value: '',
      is_required: false,
      description: ''
    }]);
  };

  const handleRemoveVariable = (index: number) => {
    setTemplateVariables(templateVariables.filter((_, i) => i !== index));
  };

  const handleVariableChange = (index: number, field: string, value: any) => {
    const updated = [...templateVariables];
    updated[index] = { ...updated[index], [field]: value };
    setTemplateVariables(updated);
  };

  const renderPreview = () => {
    let previewHtml = formData.html_template;
    let previewSubject = formData.subject_template;

    // Replace variables with sample data for preview
    templateVariables.forEach(variable => {
      if (variable.variable_name) {
        const sampleValue = getSampleValue(variable.variable_type, variable.variable_name);
        const regex = new RegExp(`\\{\\{${variable.variable_name}\\}\\}`, 'g');
        previewHtml = previewHtml.replace(regex, sampleValue);
        previewSubject = previewSubject.replace(regex, sampleValue);
      }
    });

    // Replace common variables
    previewHtml = previewHtml.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());
    previewSubject = previewSubject.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());

    return { html: previewHtml, subject: previewSubject };
  };

  const getSampleValue = (type: string | undefined, variableName: string | undefined): string => {
    if (!variableName) return '';
    
    switch (type) {
      case 'number':
        return variableName.includes('price') ? '29.99' : '123';
      case 'boolean':
        return 'true';
      case 'date':
        return new Date().toLocaleDateString();
      case 'url':
        return 'https://example.com';
      case 'string':
      default:
        if (variableName.includes('name')) return 'John Doe';
        if (variableName.includes('email')) return 'user@example.com';
        if (variableName.includes('code')) return 'ABC123';
        if (variableName.includes('message')) return 'This is a sample message.';
        return 'Sample Value';
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return false;
    }
    if (!formData.template_type) {
      toast.error('Template type is required');
      return false;
    }
    if (!formData.subject_template.trim()) {
      toast.error('Subject template is required');
      return false;
    }
    if (!formData.html_template.trim()) {
      toast.error('HTML template is required');
      return false;
    }

    // Validate variables
    for (let i = 0; i < templateVariables.length; i++) {
      const variable = templateVariables[i];
      if (!variable.variable_name?.trim()) {
        toast.error(`Variable ${i + 1} name is required`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const { html: previewHtml, subject: previewSubject } = renderPreview();

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Email Template' : 'Create Email Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this template"
                />
              </div>

              <div>
                <Label htmlFor="template_type">Template Type</Label>
                <Select
                  value={formData.template_type}
                  onValueChange={(value) => setFormData({ ...formData, template_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject Template</Label>
                <Input
                  id="subject"
                  value={formData.subject_template}
                  onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
                  placeholder="Email subject with {{variables}}"
                />
              </div>

              <div>
                <Label htmlFor="html">HTML Template</Label>
                <Textarea
                  id="html"
                  value={formData.html_template}
                  onChange={(e) => setFormData({ ...formData, html_template: e.target.value })}
                  placeholder="HTML content with {{variables}}"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active Template</Label>
              </div>
            </div>

            {/* Variables Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Template Variables</CardTitle>
                    <CardDescription>
                      Define dynamic variables that can be used in your template
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddVariable} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variable
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templateVariables.map((variable, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                      <div className="col-span-3">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={variable.variable_name || ''}
                          onChange={(e) => handleVariableChange(index, 'variable_name', e.target.value)}
                          placeholder="variableName"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={variable.variable_type}
                          onValueChange={(value) => handleVariableChange(index, 'variable_type', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VARIABLE_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Default Value</Label>
                        <Input
                          value={variable.default_value || ''}
                          onChange={(e) => handleVariableChange(index, 'default_value', e.target.value)}
                          placeholder="Optional"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Required</Label>
                        <div className="flex justify-center pt-2">
                          <Switch
                            checked={variable.is_required || false}
                            onCheckedChange={(checked) => handleVariableChange(index, 'is_required', checked)}
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={variable.description || ''}
                          onChange={(e) => handleVariableChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          onClick={() => handleRemoveVariable(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Live Preview</Label>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>

            {showPreview && (
              <Card>
                <CardHeader>
                  <Badge variant="outline" className="w-fit">Email Preview</Badge>
                  <div className="text-sm">
                    <strong>Subject:</strong> {previewSubject}
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="border rounded p-4 bg-white text-sm overflow-auto max-h-96"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </CardContent>
              </Card>
            )}

            <div className="text-sm text-slate-600 space-y-2">
              <div><strong>Available Variables:</strong></div>
              <div className="flex flex-wrap gap-1">
                {templateVariables.filter(v => v.variable_name).map((variable, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {`{{${variable.variable_name}}}`}
                  </Badge>
                ))}
                <Badge variant="secondary" className="text-xs">
                  {'{{currentYear}}'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplateEditor;