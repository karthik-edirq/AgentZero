"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Play, Pause, Trash2, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EmailImportModal } from "./email-import-modal"
import { CreateCampaignModal, type CampaignFormData } from "./create-campaign-modal"

const statusColors = {
  active: "bg-primary/10 text-primary border border-primary/20",
  paused: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  completed: "bg-green-100 text-green-800 border border-green-200",
  draft: "bg-muted text-muted-foreground border border-border",
}

const DUMMY_CAMPAIGNS = [
  {
    id: 1,
    name: "Q1 2025 Security Training",
    status: "active" as const,
    progress: 65,
    sent: 250,
    clicked: 85,
    victims: 23,
    created: "2025-01-15",
  },
  {
    id: 2,
    name: "Executive Phishing Simulation",
    status: "completed" as const,
    progress: 100,
    sent: 45,
    clicked: 18,
    victims: 8,
    created: "2024-12-20",
  },
  {
    id: 3,
    name: "HR Department Test",
    status: "paused" as const,
    progress: 42,
    sent: 120,
    clicked: 34,
    victims: 12,
    created: "2025-01-10",
  },
  {
    id: 4,
    name: "Finance Team Awareness",
    status: "draft" as const,
    progress: 0,
    sent: 0,
    clicked: 0,
    victims: 0,
    created: "2025-01-20",
  },
  {
    id: 5,
    name: "Vendor Email Spoofing",
    status: "active" as const,
    progress: 28,
    sent: 180,
    clicked: 42,
    victims: 15,
    created: "2025-01-18",
  },
]

export function CampaignView() {
  const [search, setSearch] = useState("")
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [campaigns, setCampaigns] = useState(DUMMY_CAMPAIGNS)

  const handleDelete = async (campaignId: number) => {
    console.log("Deleted campaign:", campaignId)
  }

  const handleBulkImport = (emails: Array<{ email: string; name?: string; role?: string }>) => {
    console.log("Importing emails:", emails)
  }

  const handleCreateCampaign = (data: CampaignFormData) => {
    const newCampaign = {
      id: campaigns.length + 1,
      name: data.name,
      status: "draft" as const,
      progress: 0,
      sent: 0,
      clicked: 0,
      victims: 0,
      created: new Date().toISOString().split("T")[0],
    }
    setCampaigns([newCampaign, ...campaigns])
    console.log("Created campaign:", newCampaign)
  }

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      campaign.status.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-4 md:p-8 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between scroll-animate">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage your phishing campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setImportModalOpen(true)} variant="outline" className="border-border gap-2">
            <Plus className="w-4 h-4" />
            Import Recipients
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 scroll-animate scroll-animate-delay-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Button variant="outline" size="icon" className="border-border bg-transparent">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Campaigns Table */}
      <div className="space-y-3">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign, index) => (
            <Card
              key={campaign.id}
              className="bg-card border border-border p-4 hover:shadow-sm transition-shadow scroll-animate"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                    <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                      {campaign.status}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs text-muted-foreground">{campaign.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 border border-border">
                      <div
                        className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Sent</p>
                      <p className="text-sm font-semibold text-foreground">{campaign.sent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Clicked</p>
                      <p className="text-sm font-semibold text-foreground">{campaign.clicked.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Victims</p>
                      <p className="text-sm font-semibold text-destructive">{campaign.victims}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-semibold text-foreground">{campaign.created}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {campaign.status === "active" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                  {campaign.status === "paused" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  {campaign.status === "draft" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : campaigns.length === 0 ? (
          <Card className="bg-card border border-border p-12 text-center">
            <div className="space-y-4">
              <p className="text-muted-foreground text-lg">No campaigns yet</p>
              <p className="text-sm text-muted-foreground">
                Get started by creating your first phishing simulation campaign
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm mt-4"
              >
                <Plus className="w-4 h-4" />
                Create Your First Campaign
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="bg-card border border-border p-12 text-center">
            <p className="text-muted-foreground">No campaigns found matching your search.</p>
          </Card>
        )}
      </div>

      {/* Import Modal */}
      <EmailImportModal open={importModalOpen} onOpenChange={setImportModalOpen} onImport={handleBulkImport} />

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateCampaign}
      />
    </div>
  )
}
