"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Mail, CheckCircle2, Eye, MousePointerClick, ChevronDown } from "lucide-react"
import { useCampaigns, useCampaign } from "@/hooks/use-campaigns"
import { useDashboardMetrics } from "@/hooks/use-analytics"
import { CreateCampaignModal, type CampaignFormData } from "./create-campaign-modal"
import { AddRecipientsModal } from "./add-recipients-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimelineModal } from "./timeline-modal"
import { MultiStepLoader } from "@/components/ui/multi-step-loader"
import { motion, AnimatePresence } from "motion/react"

export function DashboardView({ onCampaignSelect }: { onCampaignSelect?: (id: string | null) => void }) {
  const { campaigns, isLoading: campaignsLoading } = useCampaigns()
  const { metrics } = useDashboardMetrics()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  
  // Update selected campaign when campaigns load
  useEffect(() => {
    if (!campaignsLoading && campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].id)
    } else if (!campaignsLoading && campaigns.length === 0) {
      setSelectedCampaignId(null)
    }
  }, [campaigns, campaignsLoading, selectedCampaignId])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [addRecipientsModalOpen, setAddRecipientsModalOpen] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<any>(null)
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showDashboard, setShowDashboard] = useState(true)

  const loadingStates = [
    { text: "Searching database for relevant documents..." },
    { text: "Fetching recipients from organization..." },
    { text: "Generating personalized emails for each user..." },
    { text: "Sending emails through Resend API..." },
  ]
  const [currentDate, setCurrentDate] = useState<string>("")

  useEffect(() => {
    // Set date only on client to avoid hydration mismatch
    setCurrentDate(new Date().toLocaleDateString())
  }, [])

  const selectedCampaign = selectedCampaignId && campaigns.length > 0
    ? campaigns.find((c) => c.id === selectedCampaignId)
    : campaigns.length > 0 ? campaigns[0] : null

  const handleCreateCampaign = async (data: CampaignFormData) => {
    console.log("Created campaign:", data)
    setCreateModalOpen(false)

    // Start campaign launch sequence
    setIsLaunchingCampaign(true)
    setCurrentStep(0)

    // Step 1: Search database for relevant docs (RAG)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setCurrentStep(1)

    // Step 2: Fetch emails from organization
    const totalRecipients = data.numberOfTargets || 10
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setCurrentStep(2)

    // Step 3: Generate personalized emails
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setCurrentStep(3)

    // Step 4: Send through Resend API
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Fade out loader and fade in dashboard
    setIsLaunchingCampaign(false)
    setCurrentStep(0)
    setShowDashboard(true)
  }

  return (
    <>
      {/* Campaign Launch Multi-Step Loader */}
      <AnimatePresence mode="wait">
        {isLaunchingCampaign && (
          <MultiStepLoader
            loadingStates={loadingStates}
            loading={isLaunchingCampaign}
            duration={2000}
            loop={false}
            currentStep={currentStep}
          />
        )}
      </AnimatePresence>

      {/* Dashboard with fade-in animation */}
      <motion.div
        className="p-4 md:p-8 space-y-6 bg-background min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: showDashboard ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
      {/* Header with Campaign Selector */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {selectedCampaign?.name || "No Campaign Selected"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedCampaign ? `${selectedCampaign.status} • ${currentDate || "Loading..."}` : "Create a campaign to get started"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAddRecipientsModalOpen(true)}
            variant="outline"
            className="border-border bg-transparent gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Recipients
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
          <Button variant="outline" className="border-border bg-transparent gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Select value={selectedCampaignId || ""} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-[180px] border-border bg-transparent">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Summary Cards - Top Row */}
        <Card className="lg:col-span-2 bg-card border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
              <p className="text-3xl font-bold text-foreground mt-2">{selectedCampaign?.totalSent || 0}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mail className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 bg-card border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sent</p>
              <p className="text-3xl font-bold text-foreground mt-2">{selectedCampaign?.sent || 0}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mail className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 bg-card border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivered</p>
              <p className="text-3xl font-bold text-foreground mt-2">{selectedCampaign?.delivered || 0}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 bg-card border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Opened</p>
              <p className="text-3xl font-bold text-foreground mt-2">{selectedCampaign?.opened || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedCampaign?.openRate || 0.0}% open rate
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Eye className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 bg-card border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clicked</p>
              <p className="text-3xl font-bold text-foreground mt-2">{selectedCampaign?.clicked || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedCampaign?.clickRate || 0.0}% rate
              </p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <MousePointerClick className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        {/* Email Generator - Compact Card */}
        <Card className="lg:col-span-2 bg-card border border-border p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Email Generator</h3>
              <p className="text-xs text-muted-foreground">AI-powered email generation</p>
            </div>
            <Button
              variant="outline"
              className="w-full border-border bg-transparent"
              onClick={() => {
                // Scroll to email generator section
                document.getElementById("email-generator-section")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Generate Email
            </Button>
          </div>
        </Card>

        {/* Campaign Results Table - Full Width */}
        <Card className="lg:col-span-12 bg-card border border-border p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Campaign Results</h3>
            <p className="text-sm text-muted-foreground">
              Detailed breakdown of email delivery and engagement
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                    STATUS
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                    RECIPIENT
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                    SUBJECT
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                    SENT AT
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedCampaign && selectedCampaign.emails && selectedCampaign.emails.length > 0 ? (
                  selectedCampaign.emails.map((email: any) => (
                    <tr
                      key={email.id}
                      className="border-b border-border hover:bg-secondary transition-colors"
                    >
                      <td className="py-4 px-4">
                        {email.status === "delivered" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Delivered
                          </div>
                        ) : email.status === "bounced" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200">
                            <span className="text-red-600">!</span>
                            Bounced
                          </div>
                        ) : (
                          <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            {email.status}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground">{email.recipient}</td>
                      <td className="py-4 px-4 text-sm text-foreground">{email.subject}</td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{email.sentAt}</td>
                      <td className="py-4 px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedEmail(email)
                            setTimelineOpen(true)
                          }}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-muted-foreground">
                      No emails sent yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>


      {/* Modals */}
      <CreateCampaignModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateCampaign}
      />

      <AddRecipientsModal
        open={addRecipientsModalOpen}
        onOpenChange={setAddRecipientsModalOpen}
        onSubmit={(data) => {
          console.log("Added recipients to Supabase:", data)
        }}
      />

      <TimelineModal
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        email={selectedEmail}
      />
      </motion.div>
    </>
  )
}
