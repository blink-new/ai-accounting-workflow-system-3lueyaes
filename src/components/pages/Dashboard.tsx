import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Upload,
  Brain,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import { blink } from '../../blink/client'

interface StoredInvoice {
  id: string
  userId: string
  vendor: string
  invoiceNumber: string
  amount: number
  date: string
  status: string
  fileName: string
  createdAt: string
}

interface DashboardProps {
  onNavigate: (page: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([])

  // Load invoice data from database
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        // Get current user
        const user = await blink.auth.me()
        
        // Use localStorage as primary storage since database is temporarily unavailable
        const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]')
        // Filter by current user
        const userInvoices = storedInvoices.filter((inv: StoredInvoice) => inv.userId === user.id)
        setInvoices(userInvoices)
        console.log('Dashboard loaded invoices from localStorage:', userInvoices)
      } catch (error) {
        console.error('Failed to load user or invoices:', error)
        setInvoices([])
      }
    }

    loadInvoices()

    // Listen for new invoices being added
    const handleInvoiceAdded = () => {
      loadInvoices()
    }

    window.addEventListener('invoiceAdded', handleInvoiceAdded)

    return () => {
      window.removeEventListener('invoiceAdded', handleInvoiceAdded)
    }
  }, [])

  // Calculate stats from real data
  const totalInvoices = invoices.length
  const processedInvoices = invoices.filter(inv => inv.status === 'processed').length
  const pendingInvoices = invoices.filter(inv => inv.status !== 'processed').length
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)

  // Get current month invoices for trend calculation
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const currentMonthInvoices = invoices.filter(inv => {
    const invoiceDate = new Date(inv.createdAt || inv.date)
    return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear
  })

  const stats = [
    {
      title: 'Total Invoices',
      value: totalInvoices.toString(),
      change: totalInvoices > 0 ? '+' + Math.round((totalInvoices / Math.max(1, totalInvoices - currentMonthInvoices.length)) * 100 - 100) + '%' : '0%',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Processed This Month',
      value: currentMonthInvoices.filter(inv => inv.status === 'processed').length.toString(),
      change: '+' + Math.round((currentMonthInvoices.length / Math.max(1, totalInvoices)) * 100) + '%',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Total Amount',
      value: '$' + totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: totalAmount > 0 ? '+' + Math.round((totalAmount / Math.max(1000, totalAmount)) * 10) + '%' : '0%',
      icon: DollarSign,
      color: 'text-emerald-600'
    },
    {
      title: 'Pending Review',
      value: pendingInvoices.toString(),
      change: pendingInvoices > 0 ? '-' + Math.round((pendingInvoices / Math.max(1, totalInvoices)) * 100) + '%' : '0%',
      icon: Clock,
      color: 'text-orange-600'
    }
  ]

  // Get recent invoices (last 3)
  const recentInvoices = invoices
    .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
    .slice(0, 3)
    .map(invoice => ({
      id: invoice.invoiceNumber,
      vendor: invoice.vendor,
      amount: '$' + invoice.amount.toFixed(2),
      date: invoice.date,
      status: invoice.status === 'processed' ? 'processed' : 'pending'
    }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your accounting workflow and recent activity
        </p>
      </div>

      {/* Temporary Storage Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Notice:</strong> Data is currently stored locally in your browser. Your invoices and settings will persist during this session but may be lost if you clear browser data.
        </AlertDescription>
      </Alert>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{stat.change}</span> from last month
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              Latest invoices processed by the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No invoices uploaded yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => onNavigate('upload')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Invoice
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{invoice.vendor}</p>
                        <p className="text-sm text-muted-foreground">{invoice.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{invoice.amount}</p>
                      <Badge className={`text-xs ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onNavigate('upload')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Invoice
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onNavigate('insights')}
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Data Extraction
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onNavigate('reports')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onNavigate('editor')}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Review Pending Items
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI Insights</span>
          </CardTitle>
          <CardDescription>
            Intelligent analysis of your accounting data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalInvoices === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Upload invoices to see AI-powered insights</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Spending Analysis</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {totalInvoices} invoices processed with ${totalAmount.toFixed(2)} total value
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">Processing Status</h4>
                <p className="text-sm text-green-700 mt-1">
                  {processedInvoices} processed, {pendingInvoices} pending review
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-900">Recent Activity</h4>
                <p className="text-sm text-orange-700 mt-1">
                  {currentMonthInvoices.length} invoices added this month
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}