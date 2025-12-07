"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Mail, Check, Eye, Hand, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback } from "react"

interface TimelineEvent {
  id: string
  type: "sent" | "delivered" | "opened" | "clicked" | "failed" | "bounced" | "complained" | "unsubscribed"
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

const eventIcons: Record<string, typeof Mail> = {
  sent: Mail,
  delivered: Check,
  opened: Eye,
  clicked: Hand,
  failed: X,
  bounced: X,
  complained: X,
  unsubscribed: X,
}

const eventColors: Record<string, string> = {
  sent: "bg-blue-500/10 text-blue-600 border-blue-200",
  delivered: "bg-green-500/10 text-green-600 border-green-200",
  opened: "bg-amber-500/10 text-amber-600 border-amber-200",
  clicked: "bg-red-500/10 text-red-600 border-red-200",
  failed: "bg-gray-500/10 text-gray-600 border-gray-200",
  bounced: "bg-gray-500/10 text-gray-600 border-gray-200",
  complained: "bg-orange-500/10 text-orange-600 border-orange-200",
  unsubscribed: "bg-purple-500/10 text-purple-600 border-purple-200",
}

export function TimelineModal({ open, onOpenChange, email }: TimelineModalProps) {
  const [eventsFromAPI, setEventsFromAPI] = useState<TimelineEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)

  if (!email) return null

  const fetchEvents = useCallback(async () => {
    if (!email?.id) return

    setIsLoadingEvents(true)
    try {
      const response = await fetch(`/api/emails/${email.id}/events`)
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`)
      }
      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      setEventsFromAPI(result.data || [])
    } catch (error: any) {
      console.error("Error fetching email events:", error)
      // Don't show error to user, just use fallback events
    } finally {
      setIsLoadingEvents(false)
    }
  }, [email?.id])

  // Fetch events from API when modal opens or email changes
  useEffect(() => {
    if (open && email?.id) {
      fetchEvents()
      // Set up auto-refresh every 3 seconds while modal is open
      const interval = setInterval(() => {
        fetchEvents()
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [open, email?.id, fetchEvents])

    // Generate timeline events - combine API events with fallback from email timestamps
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
    
    // Start with events from API (most accurate, from webhooks)
    const events: TimelineEvent[] = eventsFromAPI.map((event) => ({
      ...event,
      timestamp: formatTimestamp(event.timestamp) || event.timestamp,
    })).filter((event) => event.timestamp) // Filter out invalid timestamps

    // If we have API events, use them (they're from webhooks and most accurate)
    if (events.length > 0) {
      // Sort by timestamp
      events.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime()
        const dateB = new Date(b.timestamp).getTime()
        return dateA - dateB
      })
      return events
    }

    // Fallback: Generate events from email timestamp fields if API events not available
    const fallbackEvents: TimelineEvent[] = []

    // Sent event (always present)
    if (email.sent_at) {
      const sentTimestamp = formatTimestamp(email.sent_at)
      if (sentTimestamp) {
        fallbackEvents.push({
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
        fallbackEvents.push({
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
            fallbackEvents.push({
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
        fallbackEvents.push({
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
    const hasClickedEvent = fallbackEvents.some(e => e.type === "clicked")
    
    if (!hasClickedEvent) {
      if (email.clicked_at) {
        const clickedTimestamp = formatTimestamp(email.clicked_at)
        if (clickedTimestamp) {
          fallbackEvents.push({
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
            fallbackEvents.push({
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
      const hasDelivered = fallbackEvents.some(e => e.type === "delivered")
      if (!hasDelivered) {
        try {
          const sentDate = new Date(email.sent_at)
          sentDate.setSeconds(sentDate.getSeconds() + 1)
          const deliveredTimestamp = formatTimestamp(sentDate.toISOString())
          if (deliveredTimestamp) {
            // Insert delivered event before clicked (which should be last)
            const clickedIndex = fallbackEvents.findIndex(e => e.type === "clicked")
            const deliveredEvent = {
              id: "2",
              type: "delivered" as const,
              timestamp: deliveredTimestamp,
              details: "Email delivered to recipient",
            }
            if (clickedIndex >= 0) {
              fallbackEvents.splice(clickedIndex, 0, deliveredEvent)
            } else {
              fallbackEvents.push(deliveredEvent)
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
          fallbackEvents.push({
            id: "5",
            type: "failed",
            timestamp: bouncedTimestamp,
            details: "Email bounced - delivery failed",
          })
        }
      } catch {}
    }

    // Sort fallback events by timestamp to ensure proper order
    fallbackEvents.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return dateA - dateB
    })
    
    // Remove duplicate events (same type) - keep the first one
    const seenTypes = new Set<string>()
    return fallbackEvents.filter(event => {
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Status Timeline</h3>
              {isLoadingEvents && (
                <span className="text-xs text-muted-foreground">Refreshing...</span>
              )}
            </div>
            <div className="space-y-4">
              {events.length > 0 ? (
                events.map((event, idx) => {
                  const Icon = eventIcons[event.type] || Mail
                  const colors = eventColors[event.type] || eventColors.sent
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
                })
              ) : (
                <p className="text-sm text-muted-foreground">No events yet. Events will appear here as they occur.</p>
              )}
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
