import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Eye, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { EmailTemplateService } from '@/services/EmailTemplateService';

interface EmailPreviewPanelProps {
  className?: string;
}

const EmailPreviewPanel: React.FC<EmailPreviewPanelProps> = ({ className }) => {
  const [activeTemplate, setActiveTemplate] = useState<'approval' | 'reminder' | 'confirmation'>('approval');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const templates = {
    approval: EmailTemplateService.previewTemplate('approval', {}),
    reminder: EmailTemplateService.previewTemplate('reminder', { hoursRemaining: 12 }),
    confirmation: EmailTemplateService.previewTemplate('confirmation', { orderNumber: 'ORD-20240215-1234' })
  };

  const currentTemplate = templates[activeTemplate];

  const templateStats = {
    approval: {
      name: 'Approval Email',
      description: 'Initial auto-gift approval request',
      avgOpenRate: 85,
      avgClickRate: 62,
      avgApprovalRate: 78
    },
    reminder: {
      name: 'Reminder Email', 
      description: 'Reminder for pending approvals',
      avgOpenRate: 92,
      avgClickRate: 71,
      avgApprovalRate: 84
    },
    confirmation: {
      name: 'Confirmation Email',
      description: 'Approved gift confirmation',
      avgOpenRate: 96,
      avgClickRate: 34,
      avgApprovalRate: 100
    }
  };

  const stats = templateStats[activeTemplate];

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Email Template Preview & Analytics
          </CardTitle>
          <CardDescription>
            Preview email templates and view performance analytics
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTemplate} onValueChange={(value) => setActiveTemplate(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="approval">Approval</TabsTrigger>
              <TabsTrigger value="reminder">Reminder</TabsTrigger>
              <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-4">
              {/* Template Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{stats.name}</CardTitle>
                      <CardDescription>{stats.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="text-2xl font-bold text-blue-600">{stats.avgOpenRate}%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Open Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-600">{stats.avgClickRate}%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Click Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-2xl font-bold text-green-600">{stats.avgApprovalRate}%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activeTemplate === 'confirmation' ? 'Delivery Rate' : 'Approval Rate'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Template Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Email Preview</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={previewMode === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('desktop')}
                      >
                        Desktop
                      </Button>
                      <Button
                        variant={previewMode === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('mobile')}
                      >
                        Mobile
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Subject Line */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Subject:</p>
                      <p className="text-sm">{currentTemplate.subject}</p>
                    </div>

                    {/* Email Preview Frame */}
                    <div className={`border rounded-lg overflow-hidden ${
                      previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                    }`}>
                      <div className="bg-gray-100 px-3 py-2 border-b">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          <span className="text-xs text-gray-600 ml-2">
                            {previewMode === 'mobile' ? 'Mobile Preview' : 'Desktop Preview'}
                          </span>
                        </div>
                      </div>
                      <div 
                        className={`bg-white ${
                          previewMode === 'mobile' ? 'h-96' : 'h-96'
                        } overflow-y-auto`}
                        style={{ 
                          transform: previewMode === 'mobile' ? 'scale(0.8)' : 'scale(0.7)',
                          transformOrigin: 'top left',
                          width: previewMode === 'mobile' ? '125%' : '142.8%',
                          height: previewMode === 'mobile' ? '120%' : '142.8%'
                        }}
                      >
                        <iframe
                          srcDoc={currentTemplate.html}
                          className="w-full h-full border-0"
                          title="Email Preview"
                        />
                      </div>
                    </div>

                    {/* Template Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Send Test Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Template Performance Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-lg font-semibold text-blue-600">2.3 min</p>
                        <p className="text-xs text-muted-foreground">Avg. Approval Time</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <p className="text-lg font-semibold text-green-600">156</p>
                        <p className="text-xs text-muted-foreground">This Month</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-lg font-semibold text-purple-600">+12%</p>
                        <p className="text-xs text-muted-foreground">vs Last Month</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                        <p className="text-lg font-semibold text-red-600">3</p>
                        <p className="text-xs text-muted-foreground">Expired</p>
                      </div>
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      📈 Performance tracking helps optimize email templates for better approval rates
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailPreviewPanel;