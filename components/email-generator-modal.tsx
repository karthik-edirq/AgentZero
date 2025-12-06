"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Copy, Zap, Loader2, FileText, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEmailGenerator, type GeneratedEmail } from "@/hooks/use-email-generator"
import {
  LoadingGeneratingAnimation,
  LoadingRAGAnimation,
} from "./loading-animations"

// Component to render email body with proper formatting and clickable links
function EmailBodyContent({ body, subject }: { body: string; subject?: string }) {
    // Normalize
    const normalizedSubject = subject?.trim().toLowerCase() ?? ""
  
    // Split email body into lines
    let lines = body.split("\n")
  
    // Filter out ANY subject-like lines
    lines = lines.filter((line) => {
      const trimmed = line.trim().toLowerCase()
  
      // 1. Remove lines starting with "subject"
      if (trimmed.startsWith("subject")) return false
  
      // 2. Remove lines that include subject text exactly
      if (normalizedSubject && trimmed.includes(normalizedSubject)) return false
  
      return true
    })
  
    // Join back into cleaned body
    const cleanedBody = lines.join("\n").trim()
  
    // Convert URLs → clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g
  
    const formatLine = (line: string) => {
      const parts = []
      let lastIndex = 0
      let match
  
      while ((match = urlRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index))
        }
        parts.push(
          <a
            key={match.index}
            href={match[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {match[0]}
          </a>
        )
        lastIndex = urlRegex.lastIndex
      }
  
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex))
      }
  
      return parts.length > 0 ? parts : [line]
    }
  
    return (
      <div
        className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {cleanedBody.split("\n").map((line, idx) => (
          <div key={idx} className="mb-1">
            {formatLine(line)}
          </div>
        ))}
      </div>
    )
  }
  

interface EmailGeneratorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultOrganization?: string
  defaultCampaignName?: string
  defaultBusinessFunction?: string
}

export function EmailGeneratorModal({
  open,
  onOpenChange,
  defaultOrganization,
  defaultCampaignName,
  defaultBusinessFunction,
}: EmailGeneratorModalProps) {
  const [organization, setOrganization] = useState(defaultOrganization || "")
  const [campaignName, setCampaignName] = useState(defaultCampaignName || "")
  const [businessFunction, setBusinessFunction] = useState(defaultBusinessFunction || "")
  const [targetRole, setTargetRole] = useState("")
  const [context, setContext] = useState("")
  const [testLink, setTestLink] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isReadingFile, setIsReadingFile] = useState(false)
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null)
  const [showRAGAnimation, setShowRAGAnimation] = useState(false)
  const { generateEmail, isGenerating, error } = useEmailGenerator()

  // Update form fields when defaults change
  useEffect(() => {
    if (defaultOrganization) setOrganization(defaultOrganization)
    if (defaultCampaignName) setCampaignName(defaultCampaignName)
    if (defaultBusinessFunction) setBusinessFunction(defaultBusinessFunction)
  }, [defaultOrganization, defaultCampaignName, defaultBusinessFunction])

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|docx?)$/i)) {
      alert('Please upload a valid file (PDF, DOCX, or TXT)')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
    setIsReadingFile(true)

    try {
      // Read file content
      const text = await readFileContent(file)
      setContext(text)
      setIsReadingFile(false)
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Failed to read file. Please try again or paste the content manually.')
      setIsReadingFile(false)
      setUploadedFile(null)
    }
  }

  // Read file content based on file type
  const readFileContent = async (file: File): Promise<string> => {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      return await file.text()
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // For PDF, we'll need to extract text (simplified - in production, use a PDF parser)
      alert('PDF text extraction is simplified. For best results, please paste the content manually or use a TXT file.')
      return 'PDF content extraction - please paste content manually for best results.'
    } else {
      // For DOCX, we'll show a message
      alert('DOCX files require special parsing. Please paste the content manually or convert to TXT.')
      return 'DOCX content - please paste content manually or convert to TXT.'
    }
  }

  const handleGenerate = async () => {
    // Validate required fields
    if (!organization || !campaignName || !businessFunction) {
      return
    }

    // Show RAG animation first
    setShowRAGAnimation(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setShowRAGAnimation(false)

    // Then generate email
    const email = await generateEmail({
      organization,
      campaignName,
      businessFunction,
      targetRole: targetRole || undefined,
      context: context || undefined,
      testLink: testLink || undefined,
    })
    if (email) {
      setGeneratedEmail(email)
    }
  }


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleClose = () => {
    // Reset form when closing
    setGeneratedEmail(null)
    setTargetRole("")
    setContext("")
    setTestLink("")
    setUploadedFile(null)
    onOpenChange(false)
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setContext("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="!max-w-[95vw] w-[95vw] max-h-[95vh] overflow-y-auto bg-card border-border p-8" 
        showCloseButton={true}
      >
        <DialogHeader className="space-y-3 pb-6 border-b border-border mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground">
                Email Generator - Test Mail
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                AI-powered phishing email generation with Gemini API. Fill in the details below and test the email generation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Panel */}
            <div className="lg:col-span-4 space-y-6">
              {/* Organization */}
              <div className="space-y-2">
                <Label htmlFor="modal-organization" className="text-sm font-medium text-foreground">
                  Organization *
                </Label>
                <Select value={organization} onValueChange={setOrganization} required>
                  <SelectTrigger
                    id="modal-organization"
                    className="w-full bg-secondary border-border text-foreground"
                  >
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acme-corp">Acme Corporation</SelectItem>
                    <SelectItem value="tech-startup">Tech Startup Inc.</SelectItem>
                    <SelectItem value="finance-group">Finance Group Ltd.</SelectItem>
                    <SelectItem value="healthcare-sys">Healthcare Systems</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="modal-campaign-name" className="text-sm font-medium text-foreground">
                  Campaign Name *
                </Label>
                <Input
                  id="modal-campaign-name"
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Q1 2025 Security Training"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              {/* Business Function */}
              <div className="space-y-2">
                <Label htmlFor="modal-business-function" className="text-sm font-medium text-foreground">
                  Business Function *
                </Label>
                <Select value={businessFunction} onValueChange={setBusinessFunction} required>
                  <SelectTrigger
                    id="modal-business-function"
                    className="w-full bg-secondary border-border text-foreground"
                  >
                    <SelectValue placeholder="Select function" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="it">IT Department</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Role */}
              <div className="space-y-2">
                <Label htmlFor="modal-target-role" className="text-sm font-medium text-foreground">
                  Target Role (Optional)
                </Label>
                <Input
                  id="modal-target-role"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Finance Manager, HR Lead, CEO"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Test Link (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="modal-test-link" className="text-sm font-medium text-foreground">
                  Test Link (Optional)
                </Label>
                <Input
                  id="modal-test-link"
                  type="url"
                  value={testLink}
                  onChange={(e) => setTestLink(e.target.value)}
                  placeholder="https://example.com/test-link (leave empty for random link)"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  If left empty, a random test link will be generated automatically
                </p>
              </div>

              {/* Context Source (RAG) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Context Source (RAG)</Label>
                
                {/* File Upload Area */}
                <div className="relative">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary">
                    <input
                      type="file"
                      id="file-upload"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground font-medium">
                        {isReadingFile ? "Reading file..." : uploadedFile ? uploadedFile.name : "Click to upload or drag & drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        PDF, DOCX, TXT up to 10MB
                      </p>
                    </label>
                  </div>
                  {uploadedFile && (
                    <div className="mt-3 flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground truncate">{uploadedFile.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                {/* Text Input Area */}
                <div className="relative">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Or type/paste context manually:
                  </Label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Paste company context, department info, templates, or any relevant information here..."
                    className="w-full p-4 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 h-32 resize-none text-sm leading-relaxed"
                  />
                  {context && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {context.length} characters
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !organization || !campaignName || !businessFunction}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm py-6 text-base font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Email
                  </>
                )}
              </Button>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-8 space-y-6">
              {showRAGAnimation ? (
                <div className="bg-secondary border border-border rounded-lg p-16">
                  <LoadingRAGAnimation />
                </div>
              ) : isGenerating ? (
                <div className="bg-secondary border border-border rounded-lg p-16">
                  <LoadingGeneratingAnimation />
                </div>
              ) : generatedEmail ? (
                <>
                  <div className="bg-secondary border border-border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-lg font-semibold text-foreground mt-2">{generatedEmail.subject}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(generatedEmail.subject)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-secondary border border-border rounded-lg p-6 space-y-6">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Email Body</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(generatedEmail.body)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Email Preview - Test Layout (Email Client Style) */}
                    <div className="bg-white dark:bg-gray-900 border border-border rounded-lg shadow-lg overflow-hidden">
                      {/* Email Header */}
                      <div className="bg-gray-50 dark:bg-gray-800 border-b border-border px-8 py-5">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-foreground">Subject:</div>
                            <div className="text-sm text-foreground font-medium">{generatedEmail.subject}</div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">From:</span> security@company.com
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {new Date().toLocaleString()}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">To:</span> recipient@company.com
                          </div>
                        </div>
                      </div>
                      
                      {/* Email Body */}
                      <div className="px-8 py-8 bg-white dark:bg-gray-900">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <EmailBodyContent body={generatedEmail.body} subject={generatedEmail.subject} />
                        </div>
                      </div>
                      
                      {/* Email Footer */}
                      <div className="bg-gray-50 dark:bg-gray-800 border-t border-border px-8 py-4">
                        <div className="text-xs text-muted-foreground text-center">
                          This is a test preview of the generated email
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generated Metadata */}
                  <div className="bg-secondary border border-border rounded-lg p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Confidence Score</span>
                        <Badge className="bg-primary/10 text-primary border border-primary/20">
                          {generatedEmail.confidence}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Estimated Success Rate</span>
                        <Badge className="bg-accent/10 text-accent border border-accent/20">
                          {generatedEmail.successRate}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Generated via LLM</span>
                        <Badge className="bg-primary/10 text-primary border border-primary/20">
                          {generatedEmail.model}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                  <div className="bg-secondary border border-border rounded-lg p-16 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground text-base">Generated email preview will appear here</p>
                    <p className="text-sm text-muted-foreground mt-3">
                      Fill in the form and click "Generate Email" to test the API
                    </p>
                  </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

