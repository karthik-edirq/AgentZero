"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Send, Copy, Zap, Loader2, FileText, AlertCircle } from "lucide-react"
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
  LoadingSendingAnimation,
  LoadingRAGAnimation,
  LoadingResendAnimation,
} from "./loading-animations"

export function EmailGeneratorView() {
  const [organization, setOrganization] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [businessFunction, setBusinessFunction] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [context, setContext] = useState("")
  const [numberOfTargets, setNumberOfTargets] = useState<number>(0)
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null)
  const [showSendingAnimation, setShowSendingAnimation] = useState(false)
  const [showRAGAnimation, setShowRAGAnimation] = useState(false)
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 })
  const { generateEmail, isGenerating, error } = useEmailGenerator()

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
      numberOfTargets: numberOfTargets || undefined,
    })
    if (email) {
      setGeneratedEmail(email)
    }
  }

  const handleSend = async () => {
    setShowSendingAnimation(true)
    setSendProgress({ sent: 0, total: 10 })

    // Simulate sending progress
    for (let i = 1; i <= 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setSendProgress({ sent: i, total: 10 })
    }

    setShowSendingAnimation(false)
    setSendProgress({ sent: 0, total: 0 })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className="bg-card border border-border p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Email Generator</h2>
        <p className="text-sm text-muted-foreground mt-1">AI-powered phishing email generation with RAG context</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Organization */}
          <div className="space-y-2">
            <Label htmlFor="organization" className="text-sm font-medium text-foreground">
              Organization *
            </Label>
            <Select value={organization} onValueChange={setOrganization} required>
              <SelectTrigger
                id="organization"
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
            <Label htmlFor="campaign-name" className="text-sm font-medium text-foreground">
              Campaign Name *
            </Label>
            <Input
              id="campaign-name"
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
            <Label htmlFor="business-function" className="text-sm font-medium text-foreground">
              Business Function *
            </Label>
            <Select value={businessFunction} onValueChange={setBusinessFunction} required>
              <SelectTrigger
                id="business-function"
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
            <Label htmlFor="target-role" className="text-sm font-medium text-foreground">
              Target Role (Optional)
            </Label>
            <Input
              id="target-role"
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Finance Manager, HR Lead, CEO"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Number of Targets */}
          <div className="space-y-2">
            <Label htmlFor="number-of-targets" className="text-sm font-medium text-foreground">
              Number of Targets (Optional)
            </Label>
            <Input
              id="number-of-targets"
              type="number"
              min="0"
              value={numberOfTargets || ""}
              onChange={(e) => setNumberOfTargets(parseInt(e.target.value) || 0)}
              placeholder="10"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Context Source (RAG) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Context Source (RAG)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary">
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Drop files or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT up to 10MB</p>
              <input type="file" className="hidden" />
            </div>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Or paste company context, department info, templates..."
              className="w-full mt-2 p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 h-24 resize-none text-sm"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !organization || !campaignName || !businessFunction}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm"
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
        <div className="lg:col-span-2 space-y-4">
          {showRAGAnimation ? (
            <div className="bg-secondary border border-border rounded-lg p-12">
              <LoadingRAGAnimation />
            </div>
          ) : isGenerating ? (
            <div className="bg-secondary border border-border rounded-lg p-12">
              <LoadingGeneratingAnimation />
            </div>
          ) : showSendingAnimation ? (
            <div className="bg-secondary border border-border rounded-lg p-12">
              <LoadingResendAnimation sent={sendProgress.sent} total={sendProgress.total} />
            </div>
          ) : generatedEmail ? (
            <>
              <div className="bg-secondary border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Subject Line</h3>
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

              <div className="bg-secondary border border-border rounded-lg p-4 space-y-4">
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
                  <div className="bg-gray-50 dark:bg-gray-800 border-b border-border px-6 py-4">
                    <div className="space-y-2">
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
                  <div className="px-6 py-6 bg-white dark:bg-gray-900">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                        {generatedEmail.body}
                      </div>
                    </div>
                  </div>
                  
                  {/* Email Footer (Optional) */}
                  <div className="bg-gray-50 dark:bg-gray-800 border-t border-border px-6 py-3">
                    <div className="text-xs text-muted-foreground text-center">
                      This is a test preview of the generated email
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSend}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    Send Campaign
                  </Button>
                  <Button variant="outline" className="border-border bg-transparent">
                    <FileText className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Generated Metadata */}
              <div className="bg-secondary border border-border rounded-lg p-4">
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
            <div className="bg-secondary border border-border rounded-lg p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Generated email preview will appear here</p>
              <p className="text-xs text-muted-foreground mt-2">
                Add context and click "Generate Email" to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
