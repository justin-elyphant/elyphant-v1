import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Code, Smartphone, Monitor } from "lucide-react";

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

interface EmailPreviewModalProps {
  template: EmailTemplate;
  variables: EmailTemplateVariable[];
  onClose: () => void;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  template,
  variables,
  onClose
}) => {
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    variables.forEach(variable => {
      defaults[variable.variable_name] = variable.default_value || getSampleValue(variable.variable_type, variable.variable_name);
    });
    defaults['currentYear'] = new Date().getFullYear().toString();
    return defaults;
  });

  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  function getSampleValue(type: string, variableName: string): string {
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
        if (variableName.includes('message')) return 'This is a sample message from the sender.';
        if (variableName.includes('occasion')) return 'birthday';
        if (variableName.includes('gift')) return 'Wireless Headphones';
        if (variableName.includes('recipient')) return 'Sarah Johnson';
        if (variableName.includes('sender')) return 'Michael Chen';
        if (variableName.includes('user')) return 'Alex Smith';
        return 'Sample Value';
    }
  }

  const renderEmailContent = () => {
    let renderedHtml = template.html_template;
    let renderedSubject = template.subject_template;

    // Replace all variables with their values
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      renderedHtml = renderedHtml.replace(regex, value);
      renderedSubject = renderedSubject.replace(regex, value);
    });

    return { html: renderedHtml, subject: renderedSubject };
  };

  const { html: renderedHtml, subject: renderedSubject } = renderEmailContent();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview: {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Variables Panel */}
          <div className="space-y-4 overflow-y-auto max-h-[70vh]">
            <div>
              <Label className="text-lg font-semibold">Template Variables</Label>
              <p className="text-sm text-slate-600">
                Adjust values to see how the email will look with different data
              </p>
            </div>

            <div className="space-y-3">
              {variables.map((variable) => (
                <div key={variable.id}>
                  <Label htmlFor={variable.variable_name} className="text-sm font-medium flex items-center gap-1">
                    {variable.variable_name}
                    {variable.is_required && <span className="text-red-500">*</span>}
                    <Badge variant="outline" className="text-xs ml-auto">
                      {variable.variable_type}
                    </Badge>
                  </Label>
                  <Input
                    id={variable.variable_name}
                    value={variableValues[variable.variable_name] || ''}
                    onChange={(e) => setVariableValues({
                      ...variableValues,
                      [variable.variable_name]: e.target.value
                    })}
                    placeholder={variable.description || `Enter ${variable.variable_name}`}
                    className="text-sm"
                  />
                  {variable.description && (
                    <p className="text-xs text-slate-500 mt-1">{variable.description}</p>
                  )}
                </div>
              ))}
              
              <div>
                <Label htmlFor="currentYear" className="text-sm font-medium">
                  currentYear
                  <Badge variant="outline" className="text-xs ml-2">
                    number
                  </Badge>
                </Label>
                <Input
                  id="currentYear"
                  value={variableValues.currentYear || ''}
                  onChange={(e) => setVariableValues({
                    ...variableValues,
                    currentYear: e.target.value
                  })}
                  placeholder="Current year"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">Template Info</Label>
              <div className="text-xs text-slate-600 space-y-1 mt-2">
                <div><strong>Type:</strong> {template.template_type}</div>
                <div><strong>Version:</strong> {template.version}</div>
                <div><strong>Status:</strong> {template.is_active ? 'Active' : 'Inactive'}</div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode('preview')}
                  variant={viewMode === 'preview' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button
                  onClick={() => setViewMode('code')}
                  variant={viewMode === 'code' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1"
                >
                  <Code className="h-4 w-4" />
                  HTML Code
                </Button>
              </div>

              {viewMode === 'preview' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setDeviceView('desktop')}
                    variant={deviceView === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1"
                  >
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </Button>
                  <Button
                    onClick={() => setDeviceView('mobile')}
                    variant={deviceView === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1"
                  >
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </Button>
                </div>
              )}
            </div>

            <Card className="h-[60vh]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Email Subject</Badge>
                  <span className="text-sm font-mono">{renderedSubject}</span>
                </div>
              </CardHeader>
              <CardContent className="h-full pb-6">
                {viewMode === 'preview' ? (
                  <div 
                    className={`h-full overflow-auto border rounded ${
                      deviceView === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                    }`}
                    style={{ background: '#f5f5f5' }}
                  >
                    <div
                      className="h-full"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-full">
                    <pre className="text-xs bg-slate-50 p-4 rounded border h-full overflow-auto">
                      <code>{renderedHtml}</code>
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewModal;