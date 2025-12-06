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

  // Generate timeline events based on email status
  const generateEvents = (): TimelineEvent[] => {
    const today = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    const baseTime = email.sentAt
    const baseTimestamp = `${today}, ${baseTime}`
    
    const events: TimelineEvent[] = [
      {
        id: "1",
        type: "sent",
        timestamp: baseTimestamp,
        details: "Email successfully sent",
      },
    ]

    if (email.status === "delivered" || email.status === "bounced" || email.status === "clicked") {
      // Parse time and add 1 second
      const timeMatch = baseTime.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/)
      if (timeMatch) {
        let [, h, m, s, period] = timeMatch
        let hour = parseInt(h)
        let minute = parseInt(m)
        let second = parseInt(s) + 1
        
        if (second >= 60) {
          second = 0
          minute += 1
        }
        if (minute >= 60) {
          minute = 0
          hour += 1
        }
        
        const deliveredTime = `${hour}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")} ${period}`
        events.push({
          id: "2",
          type: "delivered",
          timestamp: `${today}, ${deliveredTime}`,
          details: "Email delivered to recipient",
        })
      }
    }

    if (email.status === "clicked") {
      // Add 5 minutes for clicked
      const timeMatch = baseTime.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/)
      if (timeMatch) {
        let [, h, m, , period] = timeMatch
        let hour = parseInt(h)
        let minute = parseInt(m) + 5
        
        if (minute >= 60) {
          minute -= 60
          hour += 1
        }
        
        const clickedTime = `${hour}:${String(minute).padStart(2, "0")}:53 ${period}`
        events.push({
          id: "3",
          type: "clicked",
          timestamp: `${today}, ${clickedTime}`,
          details: "Recipient clicked link in email",
        })
      }
    }

    if (email.status === "bounced") {
      // Add 2 seconds for bounced
      const timeMatch = baseTime.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/)
      if (timeMatch) {
        let [, h, m, s, period] = timeMatch
        let hour = parseInt(h)
        let minute = parseInt(m)
        let second = parseInt(s) + 2
        
        if (second >= 60) {
          second = 0
          minute += 1
        }
        
        const bouncedTime = `${hour}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")} ${period}`
        events.push({
          id: "3",
          type: "failed",
          timestamp: `${today}, ${bouncedTime}`,
          details: "Email bounced - delivery failed",
        })
      }
    }

    return events
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
          <DialogTitle className="text-lg">{email.subject}</DialogTitle>
        </DialogHeader>

        {/* Email Details */}
        <Card className="bg-secondary border border-border p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recipient</p>
              <p className="text-sm font-medium text-foreground">{email.recipient}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${statusBadgeColor}`}>
                {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sent At</p>
              <p className="text-sm font-medium text-foreground">{email.sentAt}</p>
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
                    <div className="flex-1 pt-1">
                      <p className="font-medium text-foreground capitalize">{event.type}</p>
                      <p className="text-xs text-muted-foreground mt-1">{event.timestamp}</p>
                      <p className="text-sm text-muted-foreground mt-1">{event.details}</p>
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
              <div className="text-sm text-foreground whitespace-pre-wrap">
                Hi Nick,

Thanks for joining the Supabase Select Hackathon! As an attendee, you have Resend API credits waiting for you to redeem. You can access them in your Resend dashboard under Credits.

Best regards,
The Team
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
