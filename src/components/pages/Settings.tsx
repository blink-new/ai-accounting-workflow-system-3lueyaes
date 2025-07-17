import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Settings as SettingsIcon,
  Link,
  Shield,
  Bell,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Key,
  Database,
  Cloud,
  Smartphone,
  Mail,
  Webhook,
  CreditCard,
  Building,
  FileText,
  Brain,
  Camera,
  Receipt,
  Calculator,
  Globe
} from 'lucide-react'

interface IntegrationStatus {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  connected: boolean
  status: 'active' | 'inactive' | 'error' | 'pending'
  lastSync?: string
  features: string[]
}

export function Settings() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    {
      id: 'quickbooks',
      name: 'QuickBooks Online',
      description: 'Sync invoices and financial data with QuickBooks',
      icon: Building,
      connected: false,
      status: 'inactive',
      features: ['Invoice sync', 'Chart of accounts', 'Customer data', 'Tax reporting']
    },
    {
      id: 'xero',
      name: 'Xero',
      description: 'Connect to Xero accounting software',
      icon: Database,
      connected: false,
      status: 'inactive',
      features: ['Bank reconciliation', 'Invoice management', 'Financial reporting', 'Tax compliance']
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Process payments and manage subscriptions',
      icon: CreditCard,
      connected: true,
      status: 'active',
      lastSync: '2 minutes ago',
      features: ['Payment processing', 'Subscription billing', 'Customer management', 'Analytics']
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Auto-import invoices from email attachments',
      icon: Mail,
      connected: true,
      status: 'active',
      lastSync: '5 minutes ago',
      features: ['Email parsing', 'Attachment extraction', 'Auto-categorization', 'Smart filtering']
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'Sync documents and receipts from cloud storage',
      icon: Cloud,
      connected: false,
      status: 'inactive',
      features: ['File sync', 'Auto-backup', 'Document scanning', 'Version control']
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get notifications and approvals in Slack',
      icon: Webhook,
      connected: false,
      status: 'inactive',
      features: ['Real-time notifications', 'Approval workflows', 'Team collaboration', 'Status updates']
    }
  ])

  const [aiFeatures, setAiFeatures] = useState({
    receiptScanning: true,
    expenseCategoriztion: true,
    duplicateDetection: true,
    taxCompliance: false,
    fraudDetection: true,
    predictiveAnalytics: false,
    smartSearch: true,
    autoApproval: false
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    slackNotifications: false,
    pushNotifications: true,
    weeklyReports: true,
    monthlyReports: true,
    errorAlerts: true,
    approvalRequests: true,
    systemUpdates: false
  })

  const [teamSettings, setTeamSettings] = useState({
    requireApproval: true,
    approvalLimit: 1000,
    auditTrail: true,
    roleBasedAccess: true,
    twoFactorAuth: false,
    sessionTimeout: 60
  })

  const handleIntegrationToggle = async (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === integrationId) {
        const newConnected = !integration.connected
        return {
          ...integration,
          connected: newConnected,
          status: newConnected ? 'active' : 'inactive',
          lastSync: newConnected ? 'Just now' : undefined
        }
      }
      return integration
    }))

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const handleAiFeatureToggle = (feature: keyof typeof aiFeatures) => {
    setAiFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }))
  }

  const handleNotificationToggle = (setting: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
  }

  const handleTeamSettingToggle = (setting: keyof typeof teamSettings) => {
    if (typeof teamSettings[setting] === 'boolean') {
      setTeamSettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure integrations, AI features, and system preferences
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="ai-features">AI Features</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Link className="w-5 h-5" />
                <span>Connected Services</span>
              </CardTitle>
              <CardDescription>
                Connect your accounting system to external services and platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {integrations.map((integration) => {
                const Icon = integration.icon
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-foreground">{integration.name}</h3>
                          <Badge className={`text-xs ${getStatusColor(integration.status)}`}>
                            {integration.status}
                          </Badge>
                          {getStatusIcon(integration.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {integration.description}
                        </p>
                        {integration.lastSync && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last sync: {integration.lastSync}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {integration.features.slice(0, 3).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {integration.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{integration.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={integration.connected}
                        onCheckedChange={() => handleIntegrationToggle(integration.id)}
                      />
                      {integration.connected && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Configure
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage API keys and webhook endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="api-key"
                      type="password"
                      value="sk_live_••••••••••••••••"
                      readOnly
                    />
                    <Button variant="outline" size="sm">
                      <Key className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://your-app.com/webhooks"
                    defaultValue="https://ai-accounting-workflow-system-3lueyaes.sites.blink.new/api/webhooks"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Webhook className="w-4 h-4 mr-2" />
                Test Webhook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>AI-Powered Features</span>
              </CardTitle>
              <CardDescription>
                Configure artificial intelligence capabilities for enhanced automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Camera className="w-5 h-5 text-blue-600" />
                      <div>
                        <Label className="text-sm font-medium">Receipt Scanning</Label>
                        <p className="text-xs text-muted-foreground">OCR and data extraction from receipts</p>
                      </div>
                    </div>
                    <Switch
                      checked={aiFeatures.receiptScanning}
                      onCheckedChange={() => handleAiFeatureToggle('receiptScanning')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Receipt className="w-5 h-5 text-green-600" />
                      <div>
                        <Label className="text-sm font-medium">Expense Categorization</Label>
                        <p className="text-xs text-muted-foreground">Automatic expense category assignment</p>
                      </div>
                    </div>
                    <Switch
                      checked={aiFeatures.expenseCategoriztion}
                      onCheckedChange={() => handleAiFeatureToggle('expenseCategoriztion')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <div>
                        <Label className="text-sm font-medium">Duplicate Detection</Label>
                        <p className="text-xs text-muted-foreground">Identify and flag duplicate invoices</p>
                      </div>
                    </div>
                    <Switch
                      checked={aiFeatures.duplicateDetection}
                      onCheckedChange={() => handleAiFeatureToggle('duplicateDetection')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calculator className="w-5 h-5 text-orange-600" />
                      <div>
                        <Label className="text-sm font-medium">Tax Compliance</Label>
                        <p className="text-xs text-muted-foreground">Automated tax calculation and compliance</p>
                      </div>
                    </div>
                    <Switch
                      checked={aiFeatures.taxCompliance}
                      onCheckedChange={() => handleAiFeatureToggle('taxCompliance')}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <Label className="text-sm font-medium">Fraud Detection</Label>
                        <p className="text-xs text-muted-foreground">AI-powered fraud and anomaly detection</p>
                      </div>
                    </div>
                    <Switch
                      checked={aiFeatures.fraudDetection}
                      onCheckedChange={() => handleAiFeatureToggle('fraudDetection')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <div>
                        <Label className="text-sm font-medium">Predictive Analytics</Label>
                        <p className="text-xs text-muted-foreground">Cash flow and spending predictions</p>
                      </div>
                    </div>
                    <Switch
                      checked={aiFeatures.predictiveAnalytics}
                      onCheckedChange={() => handleAiFeatureToggle('predictiveAnalytics')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-teal-600" />
                      <div>
                        <Label className="text-sm font-medium">Smart Search</Label>
                        <p className="text-xs text-muted-foreground">Natural language search and queries</p>
                      </div>
                    </div>
                    <Switch
                      checked={aiFeatures.smartSearch}
                      onCheckedChange={() => handleAiFeatureToggle('smartSearch')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                      <div>
                        <Label className="text-sm font-medium">Auto Approval</Label>
                        <p className="text-xs text-muted-foreground">Automatic approval for trusted vendors</p>
                      </div>
                    </div>
                    <Switch
                      checked={aiFeatures.autoApproval}
                      onCheckedChange={() => handleAiFeatureToggle('autoApproval')}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <Alert>
                <Brain className="w-4 h-4" />
                <AlertDescription>
                  AI features require additional processing power and may incur extra costs. 
                  Some features are currently in beta and may have limited accuracy.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Delivery Methods</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <Label className="text-sm font-medium">Email Notifications</Label>
                        <p className="text-xs text-muted-foreground">Receive updates via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Webhook className="w-5 h-5 text-green-600" />
                      <div>
                        <Label className="text-sm font-medium">Slack Notifications</Label>
                        <p className="text-xs text-muted-foreground">Get notified in Slack channels</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.slackNotifications}
                      onCheckedChange={() => handleNotificationToggle('slackNotifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                      <div>
                        <Label className="text-sm font-medium">Push Notifications</Label>
                        <p className="text-xs text-muted-foreground">Browser push notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={() => handleNotificationToggle('pushNotifications')}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Notification Types</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <div>
                        <Label className="text-sm font-medium">Weekly Reports</Label>
                        <p className="text-xs text-muted-foreground">Weekly summary reports</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={() => handleNotificationToggle('weeklyReports')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-teal-600" />
                      <div>
                        <Label className="text-sm font-medium">Monthly Reports</Label>
                        <p className="text-xs text-muted-foreground">Monthly financial summaries</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.monthlyReports}
                      onCheckedChange={() => handleNotificationToggle('monthlyReports')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <Label className="text-sm font-medium">Error Alerts</Label>
                        <p className="text-xs text-muted-foreground">System errors and failures</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.errorAlerts}
                      onCheckedChange={() => handleNotificationToggle('errorAlerts')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                      <div>
                        <Label className="text-sm font-medium">Approval Requests</Label>
                        <p className="text-xs text-muted-foreground">Invoice approval notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.approvalRequests}
                      onCheckedChange={() => handleNotificationToggle('approvalRequests')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Team & Security Settings</span>
              </CardTitle>
              <CardDescription>
                Manage team access, permissions, and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Access Control</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Require Approval</Label>
                      <p className="text-xs text-muted-foreground">Require approval for invoice processing</p>
                    </div>
                    <Switch
                      checked={teamSettings.requireApproval}
                      onCheckedChange={() => handleTeamSettingToggle('requireApproval')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approval-limit">Approval Limit ($)</Label>
                    <Input
                      id="approval-limit"
                      type="number"
                      value={teamSettings.approvalLimit}
                      onChange={(e) => setTeamSettings(prev => ({
                        ...prev,
                        approvalLimit: parseInt(e.target.value) || 0
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Invoices above this amount require approval
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Audit Trail</Label>
                      <p className="text-xs text-muted-foreground">Track all user actions and changes</p>
                    </div>
                    <Switch
                      checked={teamSettings.auditTrail}
                      onCheckedChange={() => handleTeamSettingToggle('auditTrail')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Role-Based Access</Label>
                      <p className="text-xs text-muted-foreground">Enable role-based permissions</p>
                    </div>
                    <Switch
                      checked={teamSettings.roleBasedAccess}
                      onCheckedChange={() => handleTeamSettingToggle('roleBasedAccess')}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Security</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                      <p className="text-xs text-muted-foreground">Require 2FA for all team members</p>
                    </div>
                    <Switch
                      checked={teamSettings.twoFactorAuth}
                      onCheckedChange={() => handleTeamSettingToggle('twoFactorAuth')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={teamSettings.sessionTimeout}
                      onChange={(e) => setTeamSettings(prev => ({
                        ...prev,
                        sessionTimeout: parseInt(e.target.value) || 60
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically log out inactive users
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Team Members</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">JD</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">John Doe</p>
                        <p className="text-sm text-muted-foreground">john@company.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Admin</Badge>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">JS</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Jane Smith</p>
                        <p className="text-sm text-muted-foreground">jane@company.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Editor</Badge>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>

                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Team Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status and version information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">System Status</span>
              </div>
              <p className="text-sm text-green-700 mt-1">All systems operational</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Database</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">Connected and synced</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">AI Services</span>
              </div>
              <p className="text-sm text-purple-700 mt-1">Version 2.1.0 - Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}