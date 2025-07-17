import { useState, useEffect, useCallback } from 'react'
import { 
  Save, 
  Edit3, 
  Check, 
  X, 
  AlertTriangle, 
  Brain, 
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Wand2,
  Users,
  MessageSquare,
  Clock,
  Eye,
  Share2,
  UserCheck,
  History,
  Bell,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Send
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Separator } from '../ui/separator'
import { Alert, AlertDescription } from '../ui/alert'
import { InvoiceDetailView } from '../ui/invoice-detail-view'
import { blink } from '../../blink/client'
import { toast } from 'sonner'

interface InvoiceData {
  id: string
  fileName: string
  fileUrl?: string
  vendor: string
  invoiceNumber: string
  amount: number
  date: string
  dueDate: string
  description: string
  category: string
  taxAmount?: number
  status: 'draft' | 'validated' | 'error' | 'pending_approval' | 'approved' | 'rejected'
  confidence: number
  aiConfidence: number
  extractedFields: ExtractedField[]
  assignedTo?: string
  approver?: string
  comments: Comment[]
  auditTrail: AuditEntry[]
  sharedWith: string[]
  lastModified: string
  lastModifiedBy: string
}

interface ExtractedField {
  id: string
  name: string
  value: string
  originalValue: string
  confidence: number
  isEdited: boolean
  isValidated: boolean
  suggestions?: string[]
  editedBy?: string
  editedAt?: string
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  timestamp: string
  type: 'comment' | 'approval' | 'rejection'
}

interface AuditEntry {
  id: string
  action: string
  userId: string
  userName: string
  timestamp: string
  details: string
  fieldChanged?: string
  oldValue?: string
  newValue?: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'editor' | 'approver' | 'viewer'
  status: 'online' | 'offline' | 'away'
}

const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'John Doe', email: 'john@company.com', role: 'approver', status: 'online' },
  { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'editor', status: 'online' },
  { id: '3', name: 'Mike Johnson', email: 'mike@company.com', role: 'viewer', status: 'away' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', role: 'editor', status: 'offline' }
]

const mockInvoiceData: InvoiceData[] = [
  {
    id: '1',
    fileName: 'invoice_acme_001.pdf',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
    vendor: 'Acme Corporation',
    invoiceNumber: 'INV-2024-001',
    amount: 1234.56,
    date: '2024-01-15',
    dueDate: '2024-02-15',
    description: 'Office supplies and equipment',
    category: 'Office Supplies',
    taxAmount: 123.46,
    status: 'approved',
    confidence: 95,
    aiConfidence: 95,
    assignedTo: 'Jane Smith',
    approver: 'John Doe',
    sharedWith: ['jane@company.com', 'john@company.com'],
    lastModified: '2024-01-16T10:30:00Z',
    lastModifiedBy: 'Jane Smith',
    comments: [
      {
        id: '1',
        userId: '2',
        userName: 'Jane Smith',
        message: 'Verified vendor information and amount. Ready for approval.',
        timestamp: '2024-01-16T09:15:00Z',
        type: 'comment'
      },
      {
        id: '2',
        userId: '1',
        userName: 'John Doe',
        message: 'Approved. All details look correct.',
        timestamp: '2024-01-16T10:30:00Z',
        type: 'approval'
      }
    ],
    auditTrail: [
      {
        id: '1',
        action: 'Created',
        userId: 'system',
        userName: 'System',
        timestamp: '2024-01-15T14:20:00Z',
        details: 'Invoice uploaded and processed'
      },
      {
        id: '2',
        action: 'Field Updated',
        userId: '2',
        userName: 'Jane Smith',
        timestamp: '2024-01-16T09:10:00Z',
        details: 'Updated vendor name',
        fieldChanged: 'Vendor Name',
        oldValue: 'Acme Corp.',
        newValue: 'Acme Corporation'
      },
      {
        id: '3',
        action: 'Approved',
        userId: '1',
        userName: 'John Doe',
        timestamp: '2024-01-16T10:30:00Z',
        details: 'Invoice approved for processing'
      }
    ],
    extractedFields: [
      { id: '1', name: 'Vendor Name', value: 'Acme Corporation', originalValue: 'Acme Corp.', confidence: 98, isEdited: true, isValidated: true, editedBy: 'Jane Smith', editedAt: '2024-01-16T09:10:00Z' },
      { id: '2', name: 'Invoice Number', value: 'INV-2024-001', originalValue: 'INV-2024-001', confidence: 100, isEdited: false, isValidated: true },
      { id: '3', name: 'Amount', value: '1234.56', originalValue: '1,234.56', confidence: 99, isEdited: true, isValidated: true },
      { id: '4', name: 'Date', value: '2024-01-15', originalValue: '01/15/2024', confidence: 97, isEdited: true, isValidated: true }
    ]
  },
  {
    id: '2',
    fileName: 'tech_solutions_invoice.pdf',
    fileUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop',
    vendor: 'Tech Solutions Ltd',
    invoiceNumber: 'TS-2024-0089',
    amount: 2890.00,
    date: '2024-01-14',
    dueDate: '2024-02-14',
    description: 'Software licensing and support',
    category: 'Software',
    status: 'pending_approval',
    confidence: 87,
    aiConfidence: 87,
    assignedTo: 'Jane Smith',
    approver: 'John Doe',
    sharedWith: ['jane@company.com', 'john@company.com'],
    lastModified: '2024-01-16T11:45:00Z',
    lastModifiedBy: 'Jane Smith',
    comments: [
      {
        id: '3',
        userId: '2',
        userName: 'Jane Smith',
        message: 'Amount seems high for this vendor. Please review.',
        timestamp: '2024-01-16T11:45:00Z',
        type: 'comment'
      }
    ],
    auditTrail: [
      {
        id: '4',
        action: 'Created',
        userId: 'system',
        userName: 'System',
        timestamp: '2024-01-14T16:30:00Z',
        details: 'Invoice uploaded and processed'
      },
      {
        id: '5',
        action: 'Submitted for Approval',
        userId: '2',
        userName: 'Jane Smith',
        timestamp: '2024-01-16T11:45:00Z',
        details: 'Invoice submitted for approval'
      }
    ],
    extractedFields: [
      { id: '5', name: 'Vendor Name', value: 'Tech Solutions Ltd', originalValue: 'Tech Solutions Ltd', confidence: 95, isEdited: false, isValidated: false },
      { id: '6', name: 'Invoice Number', value: 'TS-2024-0089', originalValue: 'TS-2024-0089', confidence: 100, isEdited: false, isValidated: true },
      { id: '7', name: 'Amount', value: '2890.00', originalValue: '2,890', confidence: 85, isEdited: false, isValidated: false, suggestions: ['2890.00', '2890', '28.90'] },
      { id: '8', name: 'Date', value: '2024-01-14', originalValue: 'Jan 14, 2024', confidence: 92, isEdited: false, isValidated: false }
    ]
  }
]

export function DataEditor() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [showDetailView, setShowDetailView] = useState(false)
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [currentUser] = useState({ id: '2', name: 'Jane Smith', role: 'editor' })

  // Load invoice data from database with collaboration features
  const loadInvoiceData = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      
      try {
        // Fetch invoices from database
        const dbInvoices = await blink.db.invoices.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        })
        
        // Convert database invoice data to DataEditor format with collaboration features
        const convertedData: InvoiceData[] = dbInvoices.map((invoice: any) => ({
          id: invoice.id,
          fileName: invoice.fileName,
          fileUrl: invoice.fileUrl || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
          vendor: invoice.vendor,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          date: invoice.date,
          dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: invoice.description || '',
          category: invoice.category || 'Other',
          taxAmount: 0,
          status: invoice.status === 'processed' ? 'validated' : 'draft',
          confidence: invoice.aiConfidence || 50,
          aiConfidence: invoice.aiConfidence || 50,
          assignedTo: 'Jane Smith',
          approver: 'John Doe',
          sharedWith: ['jane@company.com', 'john@company.com'],
          lastModified: invoice.updatedAt || invoice.createdAt,
          lastModifiedBy: currentUser.name,
          comments: [],
          auditTrail: [
            {
              id: `${invoice.id}-created`,
              action: 'Created',
              userId: 'system',
              userName: 'System',
              timestamp: invoice.createdAt,
              details: 'Invoice uploaded and processed'
            }
          ],
          extractedFields: [
            {
              id: `${invoice.id}-vendor`,
              name: 'Vendor Name',
              value: invoice.vendor,
              originalValue: invoice.vendor,
              confidence: invoice.aiConfidence || 50,
              isEdited: false,
              isValidated: invoice.status === 'processed'
            },
            {
              id: `${invoice.id}-number`,
              name: 'Invoice Number',
              value: invoice.invoiceNumber,
              originalValue: invoice.invoiceNumber,
              confidence: invoice.aiConfidence || 50,
              isEdited: false,
              isValidated: invoice.status === 'processed'
            },
            {
              id: `${invoice.id}-amount`,
              name: 'Amount',
              value: invoice.amount.toString(),
              originalValue: invoice.amount.toString(),
              confidence: invoice.aiConfidence || 50,
              isEdited: false,
              isValidated: invoice.status === 'processed'
            },
            {
              id: `${invoice.id}-date`,
              name: 'Date',
              value: invoice.date,
              originalValue: invoice.date,
              confidence: invoice.aiConfidence || 50,
              isEdited: false,
              isValidated: invoice.status === 'processed'
            }
          ]
        }))
        
        setInvoiceData(convertedData)
        
        // Add mock data for demonstration if no real data exists
        if (convertedData.length === 0) {
          setInvoiceData(mockInvoiceData)
        }
        
      } catch (dbError) {
        console.warn('Database not available, falling back to localStorage:', dbError)
        
        // Fallback to localStorage if database fails
        const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]')
        
        // Convert stored invoice data to DataEditor format with collaboration features
        const convertedData: InvoiceData[] = storedInvoices.map((invoice: any) => ({
          id: invoice.id,
          fileName: invoice.fileName,
          fileUrl: invoice.fileUrl || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
          vendor: invoice.vendor,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          date: invoice.date,
          dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: invoice.description || '',
          category: invoice.category || 'Other',
          taxAmount: 0,
          status: invoice.status === 'processed' ? 'validated' : 'draft',
          confidence: invoice.aiConfidence || 50,
          aiConfidence: invoice.aiConfidence || 50,
          assignedTo: 'Jane Smith',
          approver: 'John Doe',
          sharedWith: ['jane@company.com', 'john@company.com'],
          lastModified: invoice.updatedAt || invoice.createdAt,
          lastModifiedBy: currentUser.name,
          comments: [],
          auditTrail: [
            {
              id: `${invoice.id}-created`,
              action: 'Created',
              userId: 'system',
              userName: 'System',
              timestamp: invoice.createdAt,
              details: 'Invoice uploaded and processed'
            }
          ],
          extractedFields: [
            {
              id: `${invoice.id}-vendor`,
              name: 'Vendor Name',
              value: invoice.vendor,
              originalValue: invoice.vendor,
              confidence: invoice.aiConfidence || 50,
              isEdited: false,
              isValidated: invoice.status === 'processed'
            },
            {
              id: `${invoice.id}-number`,
              name: 'Invoice Number',
              value: invoice.invoiceNumber,
              originalValue: invoice.invoiceNumber,
              confidence: invoice.aiConfidence || 50,
              isEdited: false,
              isValidated: invoice.status === 'processed'
            },
            {
              id: `${invoice.id}-amount`,
              name: 'Amount',
              value: invoice.amount.toString(),
              originalValue: invoice.amount.toString(),
              confidence: invoice.aiConfidence || 50,
              isEdited: false,
              isValidated: invoice.status === 'processed'
            },
            {
              id: `${invoice.id}-date`,
              name: 'Date',
              value: invoice.date,
              originalValue: invoice.date,
              confidence: invoice.aiConfidence || 50,
              isEdited: false,
              isValidated: invoice.status === 'processed'
            }
          ]
        }))
        
        // Add mock data for demonstration if no real data exists
        if (convertedData.length === 0) {
          setInvoiceData(mockInvoiceData)
        } else {
          setInvoiceData(convertedData)
        }
      }
    } catch (error) {
      console.error('Error loading invoice data:', error)
      setInvoiceData(mockInvoiceData)
    }
  }, [currentUser.name])

  useEffect(() => {
    loadInvoiceData()
    
    const handleInvoiceAdded = () => {
      loadInvoiceData()
    }
    
    window.addEventListener('invoiceAdded', handleInvoiceAdded)
    
    return () => {
      window.removeEventListener('invoiceAdded', handleInvoiceAdded)
    }
  }, [loadInvoiceData])

  const filteredData = invoiceData.filter(invoice => {
    const matchesSearch = invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    const matchesAssignee = assigneeFilter === 'all' || invoice.assignedTo === assigneeFilter
    return matchesSearch && matchesStatus && matchesAssignee
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'validated': return 'bg-blue-100 text-blue-800'
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'validated': return <Check className="w-4 h-4 text-blue-600" />
      case 'pending_approval': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleViewInvoice = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice)
    setShowDetailView(true)
  }

  const handleSaveInvoiceFromDetailView = (invoiceId: string, updatedData: any) => {
    setInvoiceData(prev => prev.map(inv => 
      inv.id === invoiceId ? { ...inv, ...updatedData } : inv
    ))
    
    // Update localStorage if available
    try {
      const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]')
      const updatedInvoices = storedInvoices.map((inv: InvoiceData) => 
        inv.id === invoiceId ? { ...inv, ...updatedData } : inv
      )
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices))
    } catch (error) {
      console.warn('Failed to update localStorage:', error)
    }
  }

  const enhanceWithAI = async (invoiceId: string) => {
    setIsProcessingAI(true)
    try {
      const invoice = invoiceData.find(inv => inv.id === invoiceId)
      if (!invoice) return

      const { text } = await blink.ai.generateText({
        prompt: `Analyze this invoice data and suggest improvements:
        
        Vendor: ${invoice.vendor}
        Invoice Number: ${invoice.invoiceNumber}
        Amount: $${invoice.amount}
        Date: ${invoice.date}
        Description: ${invoice.description}
        
        Please suggest:
        1. Proper vendor name formatting
        2. Category classification
        3. Any data validation issues
        4. Missing information that should be captured
        
        Respond with specific suggestions for improvement.`,
        maxTokens: 300
      })

      toast.success('AI enhancement completed!')
      
      setInvoiceData(prev => prev.map(inv => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            confidence: Math.min(inv.confidence + 10, 100),
            lastModified: new Date().toISOString(),
            lastModifiedBy: currentUser.name
          }
        }
        return inv
      }))
      
    } catch (error) {
      toast.error('Failed to enhance with AI')
      console.error('AI enhancement error:', error)
    } finally {
      setIsProcessingAI(false)
    }
  }

  const saveInvoice = async (invoiceId: string) => {
    const invoice = invoiceData.find(inv => inv.id === invoiceId)
    if (!invoice) return

    try {
      // Update invoice in database
      await blink.db.invoices.update(invoiceId, {
        status: 'validated',
        updatedAt: new Date().toISOString()
      })

      setInvoiceData(prev => prev.map(inv => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status: 'validated',
            extractedFields: inv.extractedFields.map(field => ({
              ...field,
              isValidated: true
            })),
            lastModified: new Date().toISOString(),
            lastModifiedBy: currentUser.name
          }
        }
        return inv
      }))

      toast.success('Invoice data saved successfully')
    } catch (error) {
      console.error('Failed to save invoice to database:', error)
      toast.error('Failed to save invoice data')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Editor</h1>
          <p className="text-muted-foreground mt-2">
            Collaborative invoice data editing with approval workflows and audit trails
          </p>
        </div>
        
        {/* Team Status */}
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Team Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex -space-x-2">
              {teamMembers.slice(0, 4).map((member) => (
                <div key={member.id} className="relative">
                  <Avatar className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                    member.status === 'online' ? 'bg-green-500' :
                    member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                </div>
              ))}
              {teamMembers.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{teamMembers.length - 4}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="validated">Validated</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.name}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Data ({filteredData.length})</CardTitle>
          <CardDescription>
            Collaborative review and editing of extracted invoice information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No invoice data found</h3>
              <p className="text-muted-foreground mb-4">
                Upload some invoices first to see extracted data here for editing
              </p>
              <Button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigateToUpload'))}
                className="mx-auto"
              >
                <Upload className="w-4 h-4 mr-2" />
                Go to Upload Page
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.fileName}</TableCell>
                    <TableCell>{invoice.vendor}</TableCell>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(invoice.status)}
                        <Badge className={`${getStatusColor(invoice.status)}`}>
                          {invoice.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {invoice.assignedTo?.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{invoice.assignedTo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getConfidenceColor(invoice.confidence)}`}>
                        {invoice.confidence}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                          title="View and edit invoice with original document"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => enhanceWithAI(invoice.id)}
                          disabled={isProcessingAI}
                          title="Enhance with AI"
                        >
                          <Brain className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveInvoice(invoice.id)}
                          title="Save invoice"
                        >
                          <Save className="w-4 h-4" />
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {invoiceData.filter(inv => inv.status === 'approved').length}
              </div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {invoiceData.filter(inv => inv.status === 'validated').length}
              </div>
              <div className="text-sm text-muted-foreground">Validated</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {invoiceData.filter(inv => inv.status === 'pending_approval').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending Approval</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {invoiceData.filter(inv => inv.status === 'rejected').length}
              </div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {invoiceData.length > 0 ? Math.round(invoiceData.reduce((acc, inv) => acc + inv.confidence, 0) / invoiceData.length) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg. Confidence</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Detail View */}
      {selectedInvoice && (
        <InvoiceDetailView
          invoice={selectedInvoice}
          isOpen={showDetailView}
          onClose={() => {
            setShowDetailView(false)
            setSelectedInvoice(null)
          }}
          onSave={handleSaveInvoiceFromDetailView}
          mode="edit"
        />
      )}
    </div>
  )
}