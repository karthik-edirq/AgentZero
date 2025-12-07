"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Mail, Check, Eye, Hand, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimelineEvent {
  id: string
  type: "sent" | "delivered" | "opened" | "clicked" | "failed"
  timestamp: string
  details: string
}

interface TimelineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email?: {
    id: string
    recipient: string
    subject: string
    status: string
    sentAt: string
    body?: string
    sent_at?: string
    delivered_at?: string
    opened_at?: string
    clicked_at?: string
  }
}

const eventIcons = {
  sent: Mail,
  delivered: Check,
  opened: Eye,
  clicked: Hand,
  failed: X,
}

const eventColors = {
  sent: "bg-blue-500/10 text-blue-600 border-blue-200",
  delivered: "bg-green-500/10 text-green-600 border-green-200",
  opened: "bg-amber-500/10 text-amber-600 border-amber-200",
  clicked: "bg-red-500/10 text-red-600 border-red-200",
  failed: "bg-gray-500/10 text-gray-600 border-gray-200",
}

export function TimelineModal({ open, onOpenChange, email }: TimelineModalProps) {
  if (!email) return null

  // Generate timeline events based on actual timestamps from database
  const generateEvents = (): TimelineEvent[] => {
    const formatTimestamp = (dateString: string | null | undefined): string | null => {
      if (!dateString) return null
      try {
        const date = new Date(dateString)
        const dateStr = date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
        const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        return `${dateStr}, ${timeStr}`
      } catch {
        return null
      }
    }
    
    const events: TimelineEvent[] = []

    // Sent event (always present)
    if (email.sent_at) {
      const sentTimestamp = formatTimestamp(email.sent_at)
      if (sentTimestamp) {
        events.push({
          id: "1",
          type: "sent",
          timestamp: sentTimestamp,
          details: "Email successfully sent",
        })
      }
    }

    // Delivered event
    if (email.delivered_at) {
      const deliveredTimestamp = formatTimestamp(email.delivered_at)
      if (deliveredTimestamp) {
        events.push({
          id: "2",
          type: "delivered",
          timestamp: deliveredTimestamp,
          details: "Email delivered to recipient",
        })
      }
    } else if (email.status === "delivered" && email.status !== "clicked") {
      // Fallback: if status is delivered (but not clicked) but no timestamp, use sent_at + 1 second
      // Don't add delivered if status is clicked - clicked implies delivered
      if (email.sent_at) {
        try {
          const sentDate = new Date(email.sent_at)
          sentDate.setSeconds(sentDate.getSeconds() + 1)
          const deliveredTimestamp = formatTimestamp(sentDate.toISOString())
          if (deliveredTimestamp) {
            events.push({
              id: "2",
              type: "delivered",
              timestamp: deliveredTimestamp,
              details: "Email delivered to recipient",
            })
          }
        } catch {}
      }
    }

    // Opened event (if we have the timestamp)
    if (email.opened_at) {
      const openedTimestamp = formatTimestamp(email.opened_at)
      if (openedTimestamp) {
        events.push({
          id: "3",
          type: "opened",
          timestamp: openedTimestamp,
          details: "Email opened by recipient",
        })
      }
    }

    // Clicked event (use actual timestamp from database)
    // Always show clicked event if status is clicked or clicked_at exists
    // Check if we already have a clicked event to prevent duplicates
    const hasClickedEvent = events.some(e => e.type === "clicked")
    
    if (!hasClickedEvent) {
      if (email.clicked_at) {
        const clickedTimestamp = formatTimestamp(email.clicked_at)
        if (clickedTimestamp) {
          events.push({
            id: "4",
            type: "clicked",
            timestamp: clickedTimestamp,
            details: "Recipient clicked link in email",
          })
        }
      } else if (email.status === "clicked" && email.sent_at) {
        // Fallback: if status is clicked but no timestamp, use sent_at + 5 minutes
        try {
          const sentDate = new Date(email.sent_at)
          sentDate.setMinutes(sentDate.getMinutes() + 5)
          const clickedTimestamp = formatTimestamp(sentDate.toISOString())
          if (clickedTimestamp) {
            events.push({
              id: "4",
              type: "clicked",
              timestamp: clickedTimestamp,
              details: "Recipient clicked link in email",
            })
          }
        } catch {}
      }
    }
    
    // If status is clicked but we don't have delivered_at, add delivered event before clicked
    // This ensures proper event ordering
    if (email.status === "clicked" && !email.delivered_at && email.sent_at) {
      // Check if we already have a delivered event
      const hasDelivered = events.some(e => e.type === "delivered")
      if (!hasDelivered) {
        try {
          const sentDate = new Date(email.sent_at)
          sentDate.setSeconds(sentDate.getSeconds() + 1)
          const deliveredTimestamp = formatTimestamp(sentDate.toISOString())
          if (deliveredTimestamp) {
            // Insert delivered event before clicked (which should be last)
            const clickedIndex = events.findIndex(e => e.type === "clicked")
            const deliveredEvent = {
              id: "2",
              type: "delivered" as const,
              timestamp: deliveredTimestamp,
              details: "Email delivered to recipient",
            }
            if (clickedIndex >= 0) {
              events.splice(clickedIndex, 0, deliveredEvent)
            } else {
              events.push(deliveredEvent)
            }
          }
        } catch {}
      }
    }

    // Bounced event
    if (email.status === "bounced" && email.sent_at) {
      try {
        const sentDate = new Date(email.sent_at)
        sentDate.setSeconds(sentDate.getSeconds() + 2)
        const bouncedTimestamp = formatTimestamp(sentDate.toISOString())
        if (bouncedTimestamp) {
          events.push({
            id: "5",
            type: "failed",
            timestamp: bouncedTimestamp,
            details: "Email bounced - delivery failed",
          })
        }
      } catch {}
    }

    // Sort events by timestamp to ensure proper order
    events.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return dateA - dateB
    })
    
    // Remove duplicate events (same type) - keep the first one
    const seenTypes = new Set<string>()
    return events.filter(event => {
      if (seenTypes.has(event.type)) {
        return false
      }
      seenTypes.add(event.type)
      return true
    })
  }

  const events = generateEvents()
  const statusBadgeColor =
    email.status === "delivered"
      ? "bg-green-100 text-green-800 border-green-200"
      : email.status === "bounced"
        ? "bg-red-100 text-red-800 border-red-200"
        : email.status === "clicked"
          ? "bg-red-100 text-red-800 border-red-200"
          : "bg-primary/10 text-primary border-primary/20"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg break-words pr-8">{email.subject}</DialogTitle>
        </DialogHeader>

        {/* Email Details */}
        <Card className="bg-secondary border border-border p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Recipient</p>
              <p className="text-sm font-medium text-foreground truncate" title={email.recipient}>
                {email.recipient}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${statusBadgeColor} whitespace-nowrap`}>
                {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Sent At</p>
              <p className="text-sm font-medium text-foreground truncate" title={email.sentAt}>
                {email.sentAt}
              </p>
          </div>
          </div>
        </Card>

        {/* Timeline */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Status Timeline</h3>
            <div className="space-y-4">
              {events.map((event, idx) => {
                const Icon = eventIcons[event.type]
                const colors = eventColors[event.type]
                return (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full border-2 ${colors}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {idx < events.length - 1 && <div className="w-0.5 h-8 bg-border mt-2" />}
                    </div>
                    <div className="flex-1 pt-1 min-w-0">
                      <p className="font-medium text-foreground capitalize break-words">{event.type}</p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">{event.timestamp}</p>
                      <p className="text-sm text-muted-foreground mt-1 break-words">{event.details}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Email Content */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Email Content</h3>
            <Card className="bg-secondary border border-border p-4">
              <div className="text-sm text-foreground whitespace-pre-wrap break-words overflow-x-auto max-h-64 overflow-y-auto">
                {email.body || 'No email content available'}
              </div>
            </Card>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
