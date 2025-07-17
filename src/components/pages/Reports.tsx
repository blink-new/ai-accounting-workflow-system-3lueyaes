import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  Download, 
  FileText, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Filter,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  FileSpreadsheet,
  Mail,
  Printer
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

interface StoredInvoice {
  id: string
  vendor: string
  invoiceNumber: string
  amount: number
  date: string
  status: string
  fileName: string
  createdAt: string
  category?: string
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

export function Reports() {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date())
  })
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isExporting, setIsExporting] = useState(false)

  // Load invoice data
  useEffect(() => {
    const loadInvoices = () => {
      try {
        const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]')
        setInvoices(storedInvoices)
      } catch (error) {
        console.error('Error loading invoices:', error)
        setInvoices([])
      }
    }

    loadInvoices()
    const handleInvoiceAdded = () => loadInvoices()
    window.addEventListener('invoiceAdded', handleInvoiceAdded)
    return () => window.removeEventListener('invoiceAdded', handleInvoiceAdded)
  }, [])

  // Filter invoices based on date range and category
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt || invoice.date)
      const isInDateRange = isWithinInterval(invoiceDate, { start: dateRange.from, end: dateRange.to })
      const isInCategory = selectedCategory === 'all' || invoice.category === selectedCategory
      return isInDateRange && isInCategory
    })
  }, [invoices, dateRange, selectedCategory])

  // Generate monthly data for charts
  const monthlyData = useMemo(() => {
    const months = []
    const current = new Date(dateRange.from)
    
    while (current <= dateRange.to) {
      const monthStart = startOfMonth(current)
      const monthEnd = endOfMonth(current)
      
      const monthInvoices = filteredInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt || invoice.date)
        return isWithinInterval(invoiceDate, { start: monthStart, end: monthEnd })
      })
      
      months.push({
        month: format(current, 'MMM yyyy'),
        amount: monthInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        count: monthInvoices.length,
        processed: monthInvoices.filter(inv => inv.status === 'processed').length,
        pending: monthInvoices.filter(inv => inv.status !== 'processed').length
      })
      
      current.setMonth(current.getMonth() + 1)
    }
    
    return months
  }, [filteredInvoices, dateRange])

  // Generate vendor data for pie chart
  const vendorData = useMemo(() => {
    const vendorTotals = filteredInvoices.reduce((acc, invoice) => {
      acc[invoice.vendor] = (acc[invoice.vendor] || 0) + invoice.amount
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(vendorTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([vendor, amount]) => ({ vendor, amount }))
  }, [filteredInvoices])

  // Generate category data
  const categoryData = useMemo(() => {
    const categories = ['Office Supplies', 'Software', 'Travel', 'Marketing', 'Utilities', 'Other']
    return categories.map(category => {
      const categoryInvoices = filteredInvoices.filter(inv => inv.category === category || (!inv.category && category === 'Other'))
      return {
        category,
        amount: categoryInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        count: categoryInvoices.length
      }
    }).filter(item => item.amount > 0)
  }, [filteredInvoices])

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    const totalCount = filteredInvoices.length
    const processedCount = filteredInvoices.filter(inv => inv.status === 'processed').length
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0
    
    const previousPeriodStart = new Date(dateRange.from)
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 6)
    const previousPeriodInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt || invoice.date)
      return isWithinInterval(invoiceDate, { start: previousPeriodStart, end: dateRange.from })
    })
    const previousAmount = previousPeriodInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    const growth = previousAmount > 0 ? ((totalAmount - previousAmount) / previousAmount) * 100 : 0
    
    return {
      totalAmount,
      totalCount,
      processedCount,
      averageAmount,
      growth,
      processingRate: totalCount > 0 ? (processedCount / totalCount) * 100 : 0
    }
  }, [filteredInvoices, invoices, dateRange])

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    const now = new Date()
    let from: Date
    
    switch (period) {
      case '1month':
        from = startOfMonth(subMonths(now, 0))
        break
      case '3months':
        from = startOfMonth(subMonths(now, 2))
        break
      case '6months':
        from = startOfMonth(subMonths(now, 5))
        break
      case '1year':
        from = startOfMonth(subMonths(now, 11))
        break
      default:
        from = startOfMonth(subMonths(now, 5))
    }
    
    setDateRange({ from, to: endOfMonth(now) })
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true)
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (format === 'csv') {
        // Generate CSV data
        const csvData = [
          ['Invoice Number', 'Vendor', 'Amount', 'Date', 'Status', 'Category'],
          ...filteredInvoices.map(inv => [
            inv.invoiceNumber,
            inv.vendor,
            inv.amount.toString(),
            inv.date,
            inv.status,
            inv.category || 'Other'
          ])
        ]
        
        const csvContent = csvData.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `accounting-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        // For PDF and Excel, show success message
        alert(`${format.toUpperCase()} report generated successfully!`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const categories = ['all', 'Office Supplies', 'Software', 'Travel', 'Marketing', 'Utilities', 'Other']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive financial reporting and data insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  ${summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className={summary.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {summary.growth >= 0 ? '+' : ''}{summary.growth.toFixed(1)}%
                  </span> from previous period
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold text-foreground">{summary.totalCount}</p>
                <p className="text-xs text-muted-foreground">
                  {summary.processedCount} processed
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  ${summary.averageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">per invoice</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {summary.processingRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">completion rate</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Amount Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending</CardTitle>
                <CardDescription>Invoice amounts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                    <Area type="monotone" dataKey="amount" stroke="#2563EB" fill="#2563EB" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Invoice Count Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Volume</CardTitle>
                <CardDescription>Number of invoices processed</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="processed" fill="#10B981" name="Processed" />
                    <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending Trends</CardTitle>
              <CardDescription>Monthly spending patterns and growth</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                  <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Vendors</CardTitle>
                <CardDescription>Spending distribution by vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vendorData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ vendor, percent }) => `${vendor} ${(percent * 100).toFixed(0)}%`}
                    >
                      {vendorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vendor List */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Summary</CardTitle>
                <CardDescription>Detailed vendor breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vendorData.map((vendor, index) => (
                    <div key={vendor.vendor} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{vendor.vendor}</span>
                      </div>
                      <span className="font-bold">${vendor.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Spending breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={100} />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Reports</span>
          </CardTitle>
          <CardDescription>
            Download your financial reports in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="flex items-center justify-center space-x-2 h-20"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <FileText className="w-6 h-6 text-red-600" />
              <div className="text-left">
                <div className="font-medium">PDF Report</div>
                <div className="text-sm text-muted-foreground">Formatted report</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center justify-center space-x-2 h-20"
              onClick={() => handleExport('excel')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Excel Export</div>
                <div className="text-sm text-muted-foreground">Spreadsheet format</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center justify-center space-x-2 h-20"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <Download className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">CSV Data</div>
                <div className="text-sm text-muted-foreground">Raw data export</div>
              </div>
            </Button>
          </div>
          
          {isExporting && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-800">Generating report...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}