"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Loader2 } from "lucide-react"

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewCampaigns?: () => void
  onSubmit?: (data: CampaignFormData) => void
}

export interface CampaignFormData {
  name: string
  organization: string
  businessFunction: string
  numberOfTargets: number
  tags: string[]
}

export function CreateCampaignModal({
  open,
  onOpenChange,
  onViewCampaigns,
  onSubmit,
}: CreateCampaignModalProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    organization: "",
    businessFunction: "",
    numberOfTargets: 0,
    tags: [],
  })
  const [currentTag, setCurrentTag] = useState("")
  const [isFetchingRecipients, setIsFetchingRecipients] = useState(false)
  const [recipientCount, setRecipientCount] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(formData)
    }
    // Reset form
    setFormData({
      name: "",
      organization: "",
      businessFunction: "",
      numberOfTargets: 0,
      tags: [],
    })
    setCurrentTag("")
    setRecipientCount(0)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setFormData({
      name: "",
      organization: "",
      businessFunction: "",
      numberOfTargets: 0,
      tags: [],
    })
    setCurrentTag("")
    setRecipientCount(0)
    onOpenChange(false)
  }

  // Auto-fetch recipients when organization and business function are selected
  const fetchRecipientsFromSupabase = async (org: string, businessFunc: string) => {
    if (!org || !businessFunc) {
      setRecipientCount(0)
      setFormData((prev) => ({ ...prev, numberOfTargets: 0 }))
      return
    }

    setIsFetchingRecipients(true)
    // Simulate API call to Supabase
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock: Fetch recipients based on organization and business function
    // In real app, this would query Supabase: 
    // SELECT COUNT(*) FROM recipients WHERE organization = org AND (business_function = businessFunc OR businessFunc = 'all')
    const mockCount = businessFunc === "all" ? 45 : Math.floor(Math.random() * 20) + 5

    setRecipientCount(mockCount)
    setFormData((prev) => ({ ...prev, numberOfTargets: mockCount }))
    setIsFetchingRecipients(false)
  }

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()],
      })
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground">
                Create New Campaign
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Configure your phishing simulation campaign parameters.
              </DialogDescription>
            </div>
            {onViewCampaigns && (
              <Button
                variant="outline"
                onClick={onViewCampaigns}
                className="border-border bg-transparent"
              >
                View Campaigns
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaign-name" className="text-sm font-medium text-foreground">
              Campaign Name
            </Label>
            <Input
              id="campaign-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Q1 2025 Security Training"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          {/* Organization */}
          <div className="space-y-2">
            <Label htmlFor="organization" className="text-sm font-medium text-foreground">
              Organization
            </Label>
            <Select
              value={formData.organization}
              onValueChange={(value) => {
                setFormData({ ...formData, organization: value })
                // Fetch recipients when organization changes
                fetchRecipientsFromSupabase(value, formData.businessFunction)
              }}
              required
            >
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

          {/* Business Function */}
          <div className="space-y-2">
            <Label htmlFor="business-function" className="text-sm font-medium text-foreground">
              Business Function
            </Label>
            <Select
              value={formData.businessFunction}
              onValueChange={(value) => {
                setFormData({ ...formData, businessFunction: value })
                // Fetch recipients when business function changes
                fetchRecipientsFromSupabase(formData.organization, value)
              }}
              required
            >
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

          {/* Number of Targets - Auto-populated from Supabase */}
          <div className="space-y-2">
            <Label htmlFor="number-of-targets" className="text-sm font-medium text-foreground">
              Recipients Found
            </Label>
            {isFetchingRecipients ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching recipients from Supabase...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  id="number-of-targets"
                  type="number"
                  min="0"
                  value={formData.numberOfTargets}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numberOfTargets: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-secondary border-border text-foreground"
                  required
                />
                <span className="text-sm text-muted-foreground">
                  {formData.numberOfTargets > 0
                    ? `recipient${formData.numberOfTargets !== 1 ? "s" : ""} found`
                    : "No recipients"}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Recipients are automatically fetched from Supabase based on organization and business
              function
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Tags</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag (e.g., department, location)"
                className="bg-secondary border-border text-foreground"
              />
              <Button type="button" onClick={handleAddTag} variant="outline" className="border-border">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>


          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-border bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              Launch Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

