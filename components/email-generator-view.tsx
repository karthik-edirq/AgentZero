"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Send, Copy, Zap, Loader2, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEmailGenerator, type GeneratedEmail } from "@/hooks/use-email-generator"
import {
  LoadingGeneratingAnimation,
  LoadingSendingAnimation,
  LoadingRAGAnimation,
  LoadingResendAnimation,
} from "./loading-animations"

// DUMMY_GENERATED_EMAIL - COMMENTED OUT - now using real-time data from Gemini API
// const DUMMY_GENERATED_EMAIL: GeneratedEmail = {
//   subject: "Your Q1 Security Training Credentials Are Ready",
//   body: `Hi Sarah,
//
// Your Q1 Security Training credentials have been processed and are now ready to use. Please click the link below to access your personalized dashboard and complete the required modules.
//
// Access Your Dashboard: https://security-training.company.com/verify?token=9a7k3m2p
//
// Required Modules:
// - Phishing Recognition (45 min)
// - Password Security Best Practices (30 min)
// - Data Classification Training (40 min)
//
// Important: You must complete all modules by January 31, 2025. Your progress will be tracked automatically.
//
// If you have any questions or experience technical issues, contact our support team at training-support@company.com
//
// Best regards,
// Corporate Security Team`,
//   confidence: 94,
//   successRate: "42-58%",
//   model: "Claude 3.5",
// }

export function EmailGeneratorView() {
  const [context, setContext] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null)
  const [showSendingAnimation, setShowSendingAnimation] = useState(false)
  const [showRAGAnimation, setShowRAGAnimation] = useState(false)
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 })
  const { generateEmail, isGenerating, error } = useEmailGenerator()

  const handleGenerate = async () => {
    // Show RAG animation first
    setShowRAGAnimation(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setShowRAGAnimation(false)

    // Then generate email
    const email = await generateEmail(context, targetRole)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Context Source (RAG)</label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Drop files or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT up to 10MB</p>
              <input type="file" className="hidden" />
            </div>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Or paste company context, department info, templates..."
              className="w-full mt-3 p-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 h-32 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Target Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Finance Manager, HR Lead, CEO"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !context.trim()}
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
                <div className="bg-secondary p-4 rounded-lg border border-border">
                  <p className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {generatedEmail.body}
                  </p>
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
