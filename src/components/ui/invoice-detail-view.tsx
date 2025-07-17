import { useState, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download, Edit3, Save, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Separator } from './separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import { ScrollArea } from './scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { toast } from 'sonner'
import { blink } from '../../blink/client'

interface InvoiceDetailViewProps {
  invoice: {
    id: string
    fileName: string
    fileUrl: string
    vendor: string
    invoiceNumber: string
    amount: number
    date: string
    dueDate: string
    description: string
    category: string
    status: string
    aiConfidence: number
    extractedData?: string
  }
  isOpen: boolean
  onClose: () => void
  onSave?: (invoiceId: string, updatedData: any) => void
  mode?: 'view' | 'edit'
}

interface ExtractedField {
  id: string
  name: string
  value: string
  originalValue: string
  confidence: number
  isEdited: boolean
  isValidated: boolean
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export function InvoiceDetailView({ 
  invoice, 
  isOpen, 
  onClose, 
  onSave, 
  mode = 'view' 
}: InvoiceDetailViewProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editedData, setEditedData] = useState(invoice)
  const [showHighlights, setShowHighlights] = useState(true)
  const [activeField, setActiveField] = useState<string | null>(null)

  // Mock extracted fields with bounding boxes for demonstration
  const [extractedFields] = useState<ExtractedField[]>([
    {
      id: 'vendor',
      name: 'Vendor Name',
      value: invoice.vendor,
      originalValue: invoice.vendor,
      confidence: 95,
      isEdited: false,
      isValidated: true,
      boundingBox: { x: 50, y: 80, width: 200, height: 25 }
    },
    {
      id: 'invoice_number',
      name: 'Invoice Number',
      value: invoice.invoiceNumber,
      originalValue: invoice.invoiceNumber,
      confidence: 98,
      isEdited: false,
      isValidated: true,
      boundingBox: { x: 300, y: 120, width: 150, height: 20 }
    },
    {
      id: 'amount',
      name: 'Total Amount',
      value: invoice.amount.toString(),
      originalValue: invoice.amount.toString(),
      confidence: 92,
      isEdited: false,
      isValidated: false,
      boundingBox: { x: 350, y: 400, width: 100, height: 30 }
    },
    {
      id: 'date',
      name: 'Invoice Date',
      value: invoice.date,
      originalValue: invoice.date,
      confidence: 88,
      isEdited: false,
      isValidated: false,
      boundingBox: { x: 50, y: 150, width: 120, height: 20 }
    },
    {
      id: 'due_date',
      name: 'Due Date',
      value: invoice.dueDate,
      originalValue: invoice.dueDate,
      confidence: 85,
      isEdited: false,
      isValidated: false,
      boundingBox: { x: 50, y: 180, width: 120, height: 20 }
    }
  ])

  useEffect(() => {
    setEditedData(invoice)
  }, [invoice])

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setActiveField(null)
    }
  }, [isOpen])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  const handleFieldEdit = (fieldId: string, newValue: string) => {
    const fieldMap: { [key: string]: keyof typeof editedData } = {
      'vendor': 'vendor',
      'invoice_number': 'invoiceNumber',
      'amount': 'amount',
      'date': 'date',
      'due_date': 'dueDate'
    }

    const dataKey = fieldMap[fieldId]
    if (dataKey) {
      setEditedData(prev => ({
        ...prev,
        [dataKey]: dataKey === 'amount' ? parseFloat(newValue) || 0 : newValue
      }))
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(invoice.id, editedData)
      toast.success('Invoice data updated successfully')
    }
    onClose()
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    return extension || 'unknown'
  }

  const renderDocumentViewer = () => {
    const fileType = getFileType(invoice.fileName)
    
    // Handle PDF files - show in iframe
    if (fileType === 'pdf') {
      return (
        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '800px' }}>
          <iframe
            src={invoice.fileUrl}
            className="w-full h-full border-0"
            title={`PDF Viewer - ${invoice.fileName}`}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease'
            }}
          />
          
          {/* Field Highlights Overlay - positioned over iframe */}
          {showHighlights && (
            <div className="absolute inset-0 pointer-events-none">
              {extractedFields.map((field) => (
                <div
                  key={field.id}
                  className={`absolute border-2 cursor-pointer transition-all duration-200 pointer-events-auto ${
                    activeField === field.id 
                      ? 'border-blue-500 bg-blue-500/20' 
                      : field.isValidated 
                        ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20' 
                        : 'border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20'
                  }`}
                  style={{
                    left: `${field.boundingBox?.x}px`,
                    top: `${field.boundingBox?.y}px`,
                    width: `${field.boundingBox?.width}px`,
                    height: `${field.boundingBox?.height}px`,
                  }}
                  onClick={() => setActiveField(activeField === field.id ? null : field.id)}
                  title={`${field.name}: ${field.value} (${field.confidence}% confidence)`}
                >
                  {activeField === field.id && (
                    <div className="absolute -top-8 left-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {field.name}: {field.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    
    // Handle image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return (
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <div 
            className="relative inline-block"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease'
            }}
          >
            <img
              src={invoice.fileUrl}
              alt={invoice.fileName}
              className="max-w-full h-auto"
              style={{ maxHeight: '800px' }}
            />
            
            {/* Field Highlights Overlay */}
            {showHighlights && (
              <div className="absolute inset-0">
                {extractedFields.map((field) => (
                  <div
                    key={field.id}
                    className={`absolute border-2 cursor-pointer transition-all duration-200 ${
                      activeField === field.id 
                        ? 'border-blue-500 bg-blue-500/20' 
                        : field.isValidated 
                          ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20' 
                          : 'border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20'
                    }`}
                    style={{
                      left: `${field.boundingBox?.x}px`,
                      top: `${field.boundingBox?.y}px`,
                      width: `${field.boundingBox?.width}px`,
                      height: `${field.boundingBox?.height}px`,
                    }}
                    onClick={() => setActiveField(activeField === field.id ? null : field.id)}
                    title={`${field.name}: ${field.value} (${field.confidence}% confidence)`}
                  >
                    {activeField === field.id && (
                      <div className="absolute -top-8 left-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {field.name}: {field.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }
    
    // Handle other file types
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium mb-2">Document Preview</h3>
        <p className="text-muted-foreground mb-4">
          Preview not available for {fileType.toUpperCase()} files
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.open(invoice.fileUrl, '_blank')}
        >
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full m-0 rounded-none">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice Details - {invoice.fileName}</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getConfidenceColor(invoice.aiConfidence)}>
                {invoice.aiConfidence}% Confidence
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Review and validate extracted data against the original document
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(100vh-120px)]">
          {/* Document Viewer - Left Side */}
          <div className="flex-1 flex flex-col mr-6 px-6">
            {/* Document Controls */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowHighlights(!showHighlights)}
                >
                  {showHighlights ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="ml-1">Highlights</span>
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(invoice.fileUrl, '_blank')}
              >
                <Download className="w-4 h-4 mr-1" />
                Download Original
              </Button>
            </div>

            {/* Document Display */}
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-6">
                {renderDocumentViewer()}
              </div>
            </ScrollArea>
          </div>

          {/* Data Panel - Right Side */}
          <div className="w-96 flex flex-col pr-6">
            <Tabs defaultValue="extracted" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="extracted" className="flex-1 mt-4">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-4 pr-4">
                    {extractedFields.map((field) => (
                      <Card 
                        key={field.id}
                        className={`transition-all duration-200 ${
                          activeField === field.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{field.name}</CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getConfidenceColor(field.confidence)}`}
                              >
                                {field.confidence}%
                              </Badge>
                              {field.isValidated ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {mode === 'edit' && editingField === field.id ? (
                            <div className="space-y-2">
                              <Input
                                value={field.value}
                                onChange={(e) => handleFieldEdit(field.id, e.target.value)}
                                className="text-sm"
                                autoFocus
                              />
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => setEditingField(null)}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingField(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div 
                                className="text-sm font-medium cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                                onClick={() => setActiveField(activeField === field.id ? null : field.id)}
                              >
                                {field.value}
                              </div>
                              {field.originalValue !== field.value && (
                                <div className="text-xs text-muted-foreground">
                                  Original: {field.originalValue}
                                </div>
                              )}
                              {mode === 'edit' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingField(field.id)}
                                >
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="metadata" className="flex-1 mt-4">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-4 pr-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">File Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">File Name</Label>
                          <p className="text-sm font-medium">{invoice.fileName}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">File Type</Label>
                          <p className="text-sm font-medium">{getFileType(invoice.fileName).toUpperCase()}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <Badge variant="outline" className="ml-2">
                            {invoice.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Processing Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">AI Confidence</Label>
                          <p className="text-sm font-medium">{invoice.aiConfidence}%</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Fields Extracted</Label>
                          <p className="text-sm font-medium">{extractedFields.length}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Validated Fields</Label>
                          <p className="text-sm font-medium">
                            {extractedFields.filter(f => f.isValidated).length} / {extractedFields.length}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Invoice Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Total Amount</Label>
                          <p className="text-sm font-medium">${invoice.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Category</Label>
                          <p className="text-sm font-medium">{invoice.category}</p>
                        </div>
                        {invoice.description && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <p className="text-sm font-medium">{invoice.description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            {mode === 'edit' && (
              <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}