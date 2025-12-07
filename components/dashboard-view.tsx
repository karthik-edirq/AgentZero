"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Mail, CheckCircle2, Eye, MousePointerClick, ChevronDown, Trash2 } from "lucide-react"
import { useCampaigns, useCampaign, deleteCampaign } from "@/hooks/use-campaigns"
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
import { EmailGeneratorModal } from "./email-generator-modal"
import { MultiStepLoader } from "@/components/ui/multi-step-loader"
import { motion, AnimatePresence } from "motion/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function DashboardView({ onCampaignSelect }: { onCampaignSelect?: (id: string | null) => void }) {
  const { campaigns, isLoading: campaignsLoading, refresh: refreshCampaigns } = useCampaigns()
  const { metrics, refresh: refreshMetrics } = useDashboardMetrics()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  
  // Update selected campaign when campaigns load
  // Use strict equality to prevent glitching between states
  useEffect(() => {
    if (campaignsLoading === false) {
      // Only show dashboard when loading is complete
      // Show dashboard if there are campaigns, otherwise show empty state
      if (campaigns.length > 0) {
        setShowDashboard(true)
        if (!selectedCampaignId) {
          setSelectedCampaignId(campaigns[0].id)
        }
      } else {
        // No campaigns - show empty state (landing page)
        setShowDashboard(true) // Show the empty state view
        setSelectedCampaignId(null)
      }
    }
    // Don't hide dashboard during loading - just update silently to prevent glitching
  }, [campaigns, campaignsLoading, selectedCampaignId])

  // Auto-refresh campaigns and metrics every 5 seconds to get webhook updates
  // Only refresh if there are no persistent errors
  useEffect(() => {
    // Don't auto-refresh if there are critical errors (like 404s)
    // This prevents infinite retry loops
    const shouldRefresh = () => {
      // Check if we have campaigns loaded (means API is working)
      // If campaignsLoading is false and we have no campaigns, it might be a real empty state
      // But if there's an error, don't keep retrying
      return true // Always try to refresh, but errors are handled gracefully in hooks
    }

    if (shouldRefresh()) {
      const interval = setInterval(() => {
        // Only refresh if not currently loading to avoid overlapping requests
        if (!campaignsLoading) {
          refreshCampaigns().catch(err => {
            // Silently handle errors in auto-refresh to prevent console spam
            console.debug("Auto-refresh error (silenced):", err.message)
          })
        }
        refreshMetrics().catch(err => {
          // Silently handle errors in auto-refresh to prevent console spam
          console.debug("Auto-refresh error (silenced):", err.message)
        })
      }, 5000) // Refresh every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [refreshCampaigns, refreshMetrics, campaignsLoading])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [addRecipientsModalOpen, setAddRecipientsModalOpen] = useState(false)
  const [emailGeneratorModalOpen, setEmailGeneratorModalOpen] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<any>(null)
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showDashboard, setShowDashboard] = useState(true) // Start as true, show immediately without loading spinner
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadingStates = [
    { text: "Creating campaign..." },
    { text: "Verifying campaign in database..." },
    { text: "Fetching recipients and generating personalized emails..." },
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
    setCreateModalOpen(false)

    // Start loading animation immediately
    setIsLaunchingCampaign(true)
    setCurrentStep(0)

    try {
      // Step 0: Create campaign (show loading from start)
      setCurrentStep(0)
      const createResponse = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          organization: data.organization,
          businessFunction: data.businessFunction,
          tags: data.tags || [],
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || `Failed to create campaign: ${createResponse.statusText}`)
      }

      const createResult = await createResponse.json()
      console.log("Campaign creation response:", createResult)
      
      if (createResult.error) {
        throw new Error(createResult.error)
      }

      // Handle both { data: { id } } and direct { id } response formats
      const campaignData = createResult.data || createResult
      let campaignId = campaignData?.id

      // If still no ID, check if it's nested differently
      if (!campaignId && createResult.data) {
        campaignId = createResult.data[0]?.id || createResult.id
      }

      if (!campaignId) {
        console.error("Campaign creation response (no ID):", JSON.stringify(createResult, null, 2))
        throw new Error("Campaign ID not returned from API. Response: " + JSON.stringify(createResult))
      }

      // Ensure campaignId is a string
      campaignId = String(campaignId)
      console.log("Campaign created with ID:", campaignId, "Type:", typeof campaignId)

      // Step 1: Verify campaign exists in database (with retries)
      setCurrentStep(1)
      let campaignVerified = false
      let retries = 0
      const maxRetries = 5
      
      while (!campaignVerified && retries < maxRetries) {
        const verifyResponse = await fetch(`/api/campaigns/${campaignId}`)
        if (verifyResponse.ok) {
          const verifyResult = await verifyResponse.json()
          if (verifyResult.data && !verifyResult.error) {
            campaignVerified = true
            console.log("Campaign verified in database")
            break
          }
        }
        retries++
        if (retries < maxRetries) {
          console.log(`Campaign not yet visible, retrying... (${retries}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      if (!campaignVerified) {
        throw new Error("Campaign was created but could not be verified in database. Please try again.")
      }

      // Step 2: Check if recipients exist before launching
      // Fetch campaign to get organization and business function
      const checkResponse = await fetch(`/api/campaigns/${campaignId}`)
      if (!checkResponse.ok) {
        throw new Error("Failed to verify campaign before launch")
      }
      const checkResult = await checkResponse.json()
      const campaignInfo = checkResult.data
      
      if (!campaignInfo) {
        throw new Error("Campaign data not found")
      }
      
      // Check recipients directly using the recipients API
      // The campaign API returns organization as name and businessFunction as business_function
      const orgName = campaignInfo.organization || ''
      const businessFunc = campaignInfo.businessFunction || 'all'
      let recipientCount: number | undefined = undefined
      
      if (!orgName) {
        console.warn("No organization found in campaign, proceeding with launch (launch endpoint will validate)")
      } else {
        const recipientsParams = new URLSearchParams({
          organization: orgName,
          businessFunction: businessFunc,
        })
        
        const recipientsResponse = await fetch(`/api/recipients?${recipientsParams.toString()}`)
        if (!recipientsResponse.ok) {
          console.warn("Failed to check recipients, proceeding with launch (launch endpoint will validate)")
        } else {
          const recipientsResult = await recipientsResponse.json()
          
          if (recipientsResult.error) {
            console.warn("Error checking recipients:", recipientsResult.error)
          } else {
            recipientCount = recipientsResult.data?.length || 0
            
            if (recipientCount === 0) {
              setIsLaunchingCampaign(false)
              setCurrentStep(0)
              alert("Cannot launch campaign: No recipients found. Please add recipients first using the 'Add Recipients' button.")
              return
            }
            
            console.log(`Found ${recipientCount} recipients for campaign launch`)
          }
        }
      }
      
      // Step 2: Launch campaign (this will handle fetching recipients, generating emails, and sending)
      // The launch API handles all the steps server-side, which may take time
      setCurrentStep(2)
      
      console.log("Launching campaign with ID:", campaignId, "Type:", typeof campaignId, "Recipients:", recipientCount ?? "unknown")
      const launchUrl = `/api/campaigns/${String(campaignId)}/launch`
      console.log("Launch URL:", launchUrl)
      
      // The launch API will:
      // - Fetch recipients from organization
      // - Generate personalized emails for each recipient (Gemini API)
      // - Send emails via Resend API
      // This all happens server-side and may take a while
      const launchResponse = await fetch(launchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!launchResponse.ok) {
        let errorData
        try {
          errorData = await launchResponse.json()
        } catch {
          errorData = { error: `HTTP ${launchResponse.status}: ${launchResponse.statusText}` }
        }
        console.error("Launch API error:", errorData, "Status:", launchResponse.status)
        throw new Error(errorData.error || `Launch failed with status ${launchResponse.status}`)
      }

      const launchResult = await launchResponse.json()
      if (launchResult.error) {
        throw new Error(launchResult.error)
      }

      // Step 3: Complete (emails sent)
      setCurrentStep(3)
      
      // Show completion for a moment before closing
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const sentCount = launchResult.data?.sent || 0
      const failedCount = launchResult.data?.failed || 0
      const totalRecipients = launchResult.data?.totalRecipients || 0
      const results = launchResult.data?.results || []

      // Get failed recipients for error details
      const failedRecipients = results
        .filter((r: any) => r.status === 'failed')
        .map((r: any) => ({
          email: r.recipient,
          error: r.error || 'Unknown error',
        }))

      // Only throw error if ALL emails failed (not if some succeeded)
      if (sentCount === 0 && failedCount > 0) {
        const errorDetails = failedRecipients
          .map((f: any) => `${f.email}: ${f.error}`)
          .join('; ')
        throw new Error(
          `Failed to send all emails. ${failedCount} of ${totalRecipients} failed. Details: ${errorDetails}`
        )
      }

      // Log warnings for partial failures (some succeeded, some failed)
      if (failedCount > 0 && sentCount > 0) {
        console.warn(
          `Campaign launched with partial success: ${sentCount} sent, ${failedCount} failed.`,
          failedRecipients
        )
        // Show a toast or notification about partial failure (optional)
      }

      // Refresh campaigns list and select the new campaign
      await refreshCampaigns()
      setSelectedCampaignId(campaignId)
      if (onCampaignSelect) {
        onCampaignSelect(campaignId)
      }

      // Fade out loader and fade in dashboard
      setIsLaunchingCampaign(false)
      setCurrentStep(0)
      setShowDashboard(true)
    } catch (error: any) {
      console.error("Error launching campaign:", error)
      setIsLaunchingCampaign(false)
      setCurrentStep(0)
      alert(`Failed to launch campaign: ${error.message}`)
    }
  }

  const handleDeleteClick = (campaignId: string) => {
    setCampaignToDelete(campaignId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteCampaign(campaignToDelete)
      
      if (result.error) {
        throw new Error(result.error)
      }

      // If deleted campaign was selected, clear selection
      if (selectedCampaignId === campaignToDelete) {
        setSelectedCampaignId(null)
        if (onCampaignSelect) {
          onCampaignSelect(null)
        }
      }

      // Refresh campaigns list
      await refreshCampaigns()
      
      setDeleteDialogOpen(false)
      setCampaignToDelete(null)
    } catch (error: any) {
      console.error("Error deleting campaign:", error)
      alert(`Failed to delete campaign: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
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

      {/* Dashboard - Show immediately, no loading spinner */}
      {showDashboard && (
        <motion.div
          className="p-4 md:p-8 space-y-6 bg-background min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
        {/* Empty State - No Campaigns */}
        {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-foreground">AgentZero</h1>
            <p className="text-xl text-muted-foreground">Start a new campaign</p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8 py-6 text-lg"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Create Your First Campaign
          </Button>
        </div>
      ) : (
        <>
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
          <Button variant="outline" className="border-border bg-transparent gap-2" onClick={refreshCampaigns}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {selectedCampaignId && (
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
              onClick={() => handleDeleteClick(selectedCampaignId)}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
          <Select value={selectedCampaignId || ""} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-[180px] border-border bg-transparent">
              <SelectValue placeholder="Select campaign" className="truncate" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id} className="truncate max-w-[200px]">
                  <span className="truncate block" title={campaign.name}>
                    {campaign.name}
                  </span>
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
              onClick={() => setEmailGeneratorModalOpen(true)}
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
                        {email.status === "clicked" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200">
                            <MousePointerClick className="w-3 h-3" />
                            Clicked
                          </div>
                        ) : email.status === "delivered" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Delivered
                          </div>
                        ) : email.status === "bounced" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200">
                            <span className="text-red-600">!</span>
                            Bounced
                          </div>
                        ) : email.status === "failed" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200">
                            <span className="text-red-600">!</span>
                            Failed
                          </div>
                        ) : (
                    <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            {email.status}
                    </div>
                        )}
                  </td>
                      <td className="py-4 px-4 text-sm text-foreground max-w-[200px] truncate" title={email.recipient}>
                        {email.recipient}
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground max-w-[250px] truncate" title={email.subject}>
                        {email.subject}
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground whitespace-nowrap">{email.sentAt}</td>
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
        </>
        )}
        </motion.div>
      )}

      {/* Modals */}
      <CreateCampaignModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateCampaign}
        onAddRecipients={() => setAddRecipientsModalOpen(true)}
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

      <EmailGeneratorModal
        open={emailGeneratorModalOpen}
        onOpenChange={setEmailGeneratorModalOpen}
        defaultOrganization={selectedCampaign?.organization}
        defaultCampaignName={selectedCampaign?.name}
        defaultBusinessFunction={selectedCampaign?.businessFunction}
      />

      {/* Delete Campaign Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <div className="space-y-3">
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedCampaign?.name}"? This action cannot be undone.
              </AlertDialogDescription>
              <div className="text-sm">
                <p className="font-medium text-foreground mb-2">
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>The campaign and all its settings</li>
                  <li>All associated emails and email events</li>
                  <li>All campaign statistics and tracking data</li>
                </ul>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Campaign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
