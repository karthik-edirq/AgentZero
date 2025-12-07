import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * Email Events API
 * Returns email events for analytics
 * 
 * GET /api/metrics/events?campaignId=xxx&limit=100
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get('campaignId')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Fetch email events from Supabase
    let query = supabase
      .from('email_events')
      .select(`
        *,
        email:emails(
          *,
          campaign:campaigns(name),
          recipient:recipients(email, name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (campaignId) {
      query = query.eq('email.campaign_id', campaignId)
    }

    const { data: eventsData, error: eventsError } = await query

    if (eventsError) {
      throw eventsError
    }

    // Transform events for chart (group by hour)
    const eventsByHour: { [key: string]: number } = {}
    eventsData?.forEach((event: any) => {
      const hour = new Date(event.created_at).getHours()
      const timeKey = `${String(hour).padStart(2, '0')}:00`
      eventsByHour[timeKey] = (eventsByHour[timeKey] || 0) + 1
    })

    const chartData = Object.entries(eventsByHour)
      .map(([time, count]) => ({ time, events: count }))
      .sort((a, b) => a.time.localeCompare(b.time))

    // Transform events for list
    const listData = eventsData?.map((event: any) => ({
      id: event.id,
      type: event.event_type,
      campaign: event.email?.campaign?.name || 'Unknown',
      user: event.email?.recipient?.email || 'Unknown',
      status: event.event_type === 'clicked' ? 'detected' : event.event_type === 'opened' ? 'reported' : 'detected',
      time: new Date(event.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })) || []

    return NextResponse.json({
      data: {
        events: chartData,
        eventList: listData,
      },
      error: null,
    })
  } catch (error: any) {
    console.error('Events API error:', error)
    return NextResponse.json(
      { 
        data: null, 
        error: error.message || 'Failed to fetch events' 
      },
      { status: 500 }
    )
  }
}

