import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

interface TestEmailModalProps {
  template: EmailTemplate;
  variables: EmailTemplateVariable[];
  onClose: () => void;
}

const TestEmailModal: React.FC<TestEmailModalProps> = ({
  template,
  variables,
  onClose
}) => {
  const [testEmail, setTestEmail] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    variables.forEach(variable => {
      defaults[variable.variable_name] = variable.default_value || getSampleValue(variable.variable_type, variable.variable_name);
    });
    defaults['currentYear'] = new Date().getFullYear().toString();
    return defaults;
  });
  const [sending, setSending] = useState(false);

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
        if (variableName.includes('first_name')) return 'Alex';
        if (variableName.includes('name')) return 'Test User';
        if (variableName.includes('email')) return 'test@example.com';
        if (variableName.includes('code')) return 'TEST123';
        if (variableName.includes('message')) return 'This is a test message.';
        if (variableName.includes('occasion')) return 'birthday';
        if (variableName.includes('gift')) return 'Test Gift Item';
        if (variableName.includes('recipient')) return 'Test Recipient';
        if (variableName.includes('sender')) return 'Test Sender';
        if (variableName.includes('user')) return 'Test User';
        return 'Test Value';
    }
  }

  const validateForm = () => {
    if (!testEmail.trim()) {
      toast.error('Test email address is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Check required variables
    for (const variable of variables) {
      if (variable.is_required && !variableValues[variable.variable_name]?.trim()) {
        toast.error(`${variable.variable_name} is required`);
        return false;
      }
    }

    return true;
  };

  const handleSendTest = async () => {
    if (!validateForm()) return;

    setSending(true);
    try {
      // Queue the test email
      const { error } = await supabase
        .from('email_queue')
        .insert({
          template_id: template.id,
          recipient_email: testEmail,
          recipient_name: 'Test User',
          template_variables: variableValues,
          status: 'pending'
        });

      if (error) throw error;

      toast.success(`Test email queued successfully! Check ${testEmail} for delivery.`);
      onClose();
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  const renderPreview = () => {
    let previewHtml = template.html_template;
    let previewSubject = template.subject_template;

    // Replace variables with test values
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      previewHtml = previewHtml.replace(regex, value);
      previewSubject = previewSubject.replace(regex, value);
    });

    return { html: previewHtml, subject: previewSubject };
  };

  const { html: previewHtml, subject: previewSubject } = renderPreview();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test Email: {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure test email settings and variable values
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testEmail">Test Email Address</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email address to receive test"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    The test email will be sent to this address
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Variables</CardTitle>
                <CardDescription>
                  Set values for template variables in the test email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-60 overflow-y-auto">
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
                      placeholder={variable.description || `Enter test ${variable.variable_name}`}
                      className="text-sm"
                    />
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
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Test Email Notice</p>
                    <p className="text-xs mt-1">
                      This will send a real test email using your Resend configuration. 
                      Make sure you have proper RESEND_API_KEY configured in your edge functions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">Email Preview</Label>
              <p className="text-sm text-slate-600">
                Preview of how the test email will look
              </p>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Subject</Badge>
                  <span className="text-sm font-mono">{previewSubject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">To</Badge>
                  <span className="text-sm">{testEmail || 'test@example.com'}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded p-4 bg-white text-sm overflow-auto max-h-96">
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-slate-600">
              <div><strong>Template Details:</strong></div>
              <div>Type: {template.template_type}</div>
              <div>Version: {template.version}</div>
              <div>Status: {template.is_active ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-slate-600">
            Test emails are sent through the email queue system
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={sending || !testEmail}>
              {sending ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestEmailModal;