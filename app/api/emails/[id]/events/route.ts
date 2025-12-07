import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * Get email events for a specific email ID
 * GET /api/emails/[id]/events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both async and sync params (Next.js 15+ uses async params)
    const resolvedParams = params instanceof Promise ? await params : params
    const emailId = resolvedParams.id

    if (!emailId || emailId === 'undefined' || emailId === 'null') {
      return NextResponse.json(
        { data: null, error: 'Invalid email ID' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Fetch all events for this email, ordered by timestamp
    const { data: events, error } = await supabase
      .from('email_events')
      .select('*')
      .eq('email_id', emailId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching email events:', error)
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    // Transform events to match timeline format
    const timelineEvents = (events || []).map((event: any) => ({
      id: event.id,
      type: event.event_type,
      timestamp: event.created_at,
      details: getEventDetails(event.event_type, event.raw),
    }))

    return NextResponse.json({ data: timelineEvents, error: null })
  } catch (error: any) {
    console.error('Error in GET /api/emails/[id]/events:', error)
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch email events' },
      { status: 500 }
    )
  }
}

function getEventDetails(eventType: string, raw: any): string {
  const details: Record<string, string> = {
    sent: 'Email successfully sent',
    delivered: 'Email delivered to recipient',
    opened: 'Email opened by recipient',
    clicked: 'Recipient clicked link in email',
    bounced: 'Email bounced - delivery failed',
    complained: 'Recipient marked email as spam',
    unsubscribed: 'Recipient unsubscribed',
  }

  // Add additional details from raw data if available
  if (raw) {
    try {
      const rawData = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (eventType === 'clicked' && rawData.clicked_link) {
        return `Recipient clicked link: ${rawData.clicked_link}`
      }
      if (eventType === 'opened' && rawData.user_agent) {
        return `Email opened by recipient (${rawData.user_agent})`
      }
    } catch (e) {
      // If JSON parsing fails, just use default message
      console.debug('Failed to parse raw event data:', e)
    }
  }

  return details[eventType] || `Email ${eventType}`
}

