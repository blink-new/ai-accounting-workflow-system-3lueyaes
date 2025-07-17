import { useState, useCallback, useEffect } from 'react'
import { Upload, Cloud, FileText, CheckCircle, AlertCircle, Settings, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { toast } from 'sonner'
import { blink } from '../../blink/client'

interface UploadedFile {
  id: string
  name: string
  size: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  source: 'manual' | 'cloud'
  cloudProvider?: string
}

interface CloudConfig {
  id: string
  provider: 'google_drive' | 'dropbox' | 'onedrive'
  folderPath: string
  isActive: boolean
  autoSync: boolean
  lastSync?: Date
}

export function InvoiceUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [cloudConfigs, setCloudConfigs] = useState<CloudConfig[]>([])
  const [showCloudSetup, setShowCloudSetup] = useState(false)

  // Load cloud configurations from localStorage
  useEffect(() => {
    const loadCloudConfigs = async () => {
      try {
        const user = await blink.auth.me()
        
        // Use localStorage for cloud configs since database is temporarily unavailable
        const storedConfigs = localStorage.getItem(`cloudConfigs_${user.id}`)
        if (storedConfigs) {
          const parsedConfigs = JSON.parse(storedConfigs)
          setCloudConfigs(parsedConfigs)
        } else {
          // Add a default config for demo purposes
          const defaultConfigs = [
            {
              id: '1',
              provider: 'google_drive' as const,
              folderPath: '/Invoices',
              isActive: true,
              autoSync: true,
              lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000)
            }
          ]
          setCloudConfigs(defaultConfigs)
          localStorage.setItem(`cloudConfigs_${user.id}`, JSON.stringify(defaultConfigs))
        }
      } catch (error) {
        console.error('Failed to load user or cloud configs:', error)
        setCloudConfigs([])
      }
    }
    
    loadCloudConfigs()
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileUpload(droppedFiles, 'manual')
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFileUpload(selectedFiles, 'manual')
    }
  }

  const handleFileUpload = async (fileList: File[], source: 'manual' | 'cloud', cloudProvider?: string) => {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
      source,
      cloudProvider
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Process each file
    for (const newFile of newFiles) {
      try {
        const file = fileList.find(f => f.name === newFile.name)!
        
        // Upload to Blink storage
        const { publicUrl } = await blink.storage.upload(
          file,
          `invoices/${newFile.name}`,
          {
            onProgress: (percent) => {
              setFiles(prev => prev.map(f => 
                f.id === newFile.id ? { ...f, progress: percent } : f
              ))
            }
          }
        )

        // Update status to processing
        setFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'processing', progress: 100 } : f
        ))

        // AI-powered data extraction
        try {
          // Extract text from the uploaded file
          const extractedText = await blink.data.extractFromUrl(publicUrl)
          
          // Use AI to parse invoice data
          const { text: aiAnalysis } = await blink.ai.generateText({
            prompt: `Extract key invoice information from this text:

${extractedText}

Please extract and format as JSON:
{
  "vendor": "Company name",
  "invoiceNumber": "Invoice number",
  "amount": "Total amount (number only)",
  "date": "Invoice date (YYYY-MM-DD format)",
  "dueDate": "Due date (YYYY-MM-DD format)",
  "description": "Brief description of services/products",
  "category": "Expense category (Office Supplies, Software, Marketing, etc.)",
  "confidence": "Confidence score 0-100"
}

If any field cannot be determined, use null.`,
            maxTokens: 400
          })

          // Parse AI response and save to storage
          try {
            // Extract JSON from AI response
            const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/)
            let invoiceData = null
            
            if (jsonMatch) {
              invoiceData = JSON.parse(jsonMatch[0])
            }

            // Get current user
            const user = await blink.auth.me()

            // Create invoice record
            const invoiceRecord = {
              id: newFile.id,
              userId: user.id,
              vendor: invoiceData?.vendor || 'Unknown Vendor',
              invoiceNumber: invoiceData?.invoiceNumber || `AUTO-${Date.now()}`,
              amount: parseFloat(invoiceData?.amount) || 0,
              date: invoiceData?.date || new Date().toISOString().split('T')[0],
              dueDate: invoiceData?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              description: invoiceData?.description || '',
              category: invoiceData?.category || 'Uncategorized',
              status: 'processed',
              source,
              cloudProvider,
              fileUrl: publicUrl,
              fileName: newFile.name,
              fileSize: newFile.size,
              aiConfidence: parseInt(invoiceData?.confidence) || 50,
              extractedData: aiAnalysis,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            // Save to localStorage since database is temporarily unavailable
            const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]')
            existingInvoices.push(invoiceRecord)
            localStorage.setItem('invoices', JSON.stringify(existingInvoices))
            console.log('Invoice saved to localStorage:', invoiceRecord)
            
            // Always dispatch the event regardless of storage method
            window.dispatchEvent(new CustomEvent('invoiceAdded'))

            toast.success(`${newFile.name} processed successfully - extracted data for ${invoiceRecord.vendor}`)
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError)
            toast.warning(`${newFile.name} uploaded but data extraction had issues`)
          }
          
        } catch (aiError) {
          console.error('AI processing error:', aiError)
          toast.warning(`${newFile.name} uploaded but AI processing had issues`)
        }

        // Update to completed
        setFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'completed' } : f
        ))

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'error' } : f
        ))
        toast.error(`Failed to upload ${newFile.name}`)
        console.error('Upload error:', error)
      }
    }
  }

  const syncCloudStorage = async (configId: string) => {
    const config = cloudConfigs.find(c => c.id === configId)
    if (!config) return

    toast.info(`Syncing ${config.provider}...`)
    
    // Simulate cloud sync
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Simulate finding new files
    const mockFiles = [
      { name: 'Invoice_2024_001.pdf', size: 245760 },
      { name: 'Receipt_Store_ABC.jpg', size: 156432 }
    ]

    if (mockFiles.length > 0) {
      // Convert to File objects for processing
      const files = mockFiles.map(f => new File([''], f.name, { type: 'application/pdf' }))
      await handleFileUpload(files, 'cloud', config.provider)
      
      // Update last sync time in localStorage and state
      const newSyncTime = new Date()
      const updatedConfigs = cloudConfigs.map(c => 
        c.id === configId ? { ...c, lastSync: newSyncTime } : c
      )
      
      try {
        const user = await blink.auth.me()
        localStorage.setItem(`cloudConfigs_${user.id}`, JSON.stringify(updatedConfigs))
      } catch (error) {
        console.warn('Failed to update cloud config sync time in localStorage:', error)
      }
      
      setCloudConfigs(updatedConfigs)
      
      toast.success(`Found and processed ${mockFiles.length} new files from ${config.provider}`)
    } else {
      toast.info(`No new files found in ${config.provider}`)
    }
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google_drive':
        return '🗂️'
      case 'dropbox':
        return '📦'
      case 'onedrive':
        return '☁️'
      default:
        return '📁'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Invoice Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload invoices manually or sync automatically from cloud storage
        </p>
      </div>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Upload</TabsTrigger>
          <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Drag & Drop Upload</span>
              </CardTitle>
              <CardDescription>
                Drag and drop your invoice files here, or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Drop your invoice files here
                </h3>
                <p className="text-muted-foreground mb-4">
                  Supports PDF, JPG, PNG, and other common formats
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.tiff"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Browse Files
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cloud" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Cloud Storage Integrations</h2>
              <p className="text-muted-foreground">
                Automatically sync invoices from your cloud storage providers
              </p>
            </div>
            <Dialog open={showCloudSetup} onOpenChange={setShowCloudSetup}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Cloud Storage Integration</DialogTitle>
                  <DialogDescription>
                    Connect a cloud storage provider to automatically sync invoices
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_drive">Google Drive</SelectItem>
                        <SelectItem value="dropbox">Dropbox</SelectItem>
                        <SelectItem value="onedrive">OneDrive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="folder">Folder Path</Label>
                    <Input placeholder="/Invoices" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-sync" />
                    <Label htmlFor="auto-sync">Enable automatic sync</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCloudSetup(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowCloudSetup(false)}>
                      Connect
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {cloudConfigs.map((config) => (
              <Card key={config.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getProviderIcon(config.provider)}</div>
                      <div>
                        <h3 className="font-medium capitalize">
                          {config.provider.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {config.folderPath}
                        </p>
                        {config.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {config.lastSync.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={config.isActive ? 'default' : 'secondary'}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {config.autoSync && (
                        <Badge variant="outline">Auto Sync</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncCloudStorage(config.id)}
                      >
                        <Cloud className="w-4 h-4 mr-2" />
                        Sync Now
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
            <CardDescription>
              Track the status of your uploaded invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        {file.source === 'cloud' && (
                          <Badge variant="outline" className="text-xs">
                            {getProviderIcon(file.cloudProvider!)} {file.cloudProvider}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getStatusColor(file.status)}`}>
                          {file.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      {(file.status === 'uploading' || file.status === 'processing') && (
                        <div className="flex items-center space-x-2">
                          <Progress value={file.progress} className="w-24" />
                          <span className="text-xs text-muted-foreground">
                            {file.progress}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}