import { useState, useEffect } from 'react'
import { Search, Filter, Download, Eye, Edit, Trash2, ExternalLink, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { InvoiceDetailView } from '../ui/invoice-detail-view'
import { blink } from '../../blink/client'

interface Invoice {
  id: string
  userId: string
  vendor: string
  invoiceNumber: string
  amount: number
  date: string
  dueDate: string
  description: string
  category: string
  status: 'processed' | 'pending' | 'error' | 'exported'
  source: 'manual' | 'cloud'
  cloudProvider?: string
  fileUrl: string
  fileName: string
  fileSize: number
  aiConfidence: number
  extractedData: string
  createdAt: string
  updatedAt: string
}

export function InvoiceManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showDetailView, setShowDetailView] = useState(false)

  // Load invoices from database on component mount
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        // Get current user
        const user = await blink.auth.me()
        
        // Use localStorage as primary storage since database is temporarily unavailable
        const storedInvoices = localStorage.getItem('invoices')
        if (storedInvoices) {
          const parsedInvoices = JSON.parse(storedInvoices)
          // Filter by current user
          const userInvoices = parsedInvoices.filter((inv: Invoice) => inv.userId === user.id)
          setInvoices(userInvoices)
          console.log('Loaded invoices from localStorage:', userInvoices)
        } else {
          setInvoices([])
        }
      } catch (error) {
        console.error('Failed to load user or invoices:', error)
        setInvoices([])
      }
    }

    loadInvoices()

    // Listen for custom events from the upload page
    const handleInvoiceAdded = () => {
      loadInvoices()
    }

    window.addEventListener('invoiceAdded', handleInvoiceAdded)

    return () => {
      window.removeEventListener('invoiceAdded', handleInvoiceAdded)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'exported':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceIcon = (source: string, cloudProvider?: string) => {
    if (source === 'manual') return '📄'
    switch (cloudProvider) {
      case 'google_drive': return '🗂️'
      case 'dropbox': return '📦'
      case 'onedrive': return '☁️'
      default: return '📁'
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const exportToSystem = async (invoice: Invoice, destination: string) => {
    // Simulate export to external system
    console.log(`Exporting invoice ${invoice.id} to ${destination}`)
    // Here you would integrate with external systems like QuickBooks, Xero, etc.
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowDetailView(true)
  }

  const handleSaveInvoice = (invoiceId: string, updatedData: any) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { ...inv, ...updatedData } : inv
    ))
    
    // Update localStorage
    const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]')
    const updatedInvoices = storedInvoices.map((inv: Invoice) => 
      inv.id === invoiceId ? { ...inv, ...updatedData } : inv
    )
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Invoice Management</h1>
        <p className="text-muted-foreground mt-2">
          View, edit, and manage all your processed invoices
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="exported">Exported</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
          <CardDescription>
            Manage and track all your invoice data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {invoices.length === 0 ? (
                  <>
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">No invoices uploaded yet</h3>
                    <p>Upload your first invoice to get started with AI-powered data extraction</p>
                  </>
                ) : (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">No invoices match your search</h3>
                    <p>Try adjusting your search terms or filters</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getSourceIcon(invoice.source, invoice.cloudProvider)}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {invoice.source === 'cloud' ? invoice.cloudProvider : invoice.source}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{invoice.vendor}</TableCell>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewInvoice(invoice)}
                        title="View invoice details with original document"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Edit invoice">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Delete invoice">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail View */}
      {selectedInvoice && (
        <InvoiceDetailView
          invoice={selectedInvoice}
          isOpen={showDetailView}
          onClose={() => {
            setShowDetailView(false)
            setSelectedInvoice(null)
          }}
          onSave={handleSaveInvoice}
          mode="edit"
        />
      )}
    </div>
  )
}