import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * Campaign Statistics API
 * Returns email tracking statistics for a specific campaign
 * 
 * GET /api/stats/:campaignId
 * 
 * Returns:
 * - total_sent: Total emails sent
 * - total_delivered: Total emails delivered
 * - total_opened: Total emails opened
 * - total_clicked: Total emails clicked
 * - open_rate: Percentage of delivered emails that were opened
 * - click_rate: Percentage of delivered emails that were clicked
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> | { campaignId: string } }
) {
  try {
    // Handle both async and sync params (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const campaignId = resolvedParams.campaignId

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get campaign to verify it exists
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Count emails by status
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('id, status, resend_email_id')
      .eq('campaign_id', campaignId)

    if (emailsError) {
      throw emailsError
    }

    // Count events by type from email_events table
    // This uses both the emails table and email_events table for accurate tracking
    const emailIds = (emails || []).map(e => e.id).filter(Boolean)
    let events: any[] = []
    
    if (emailIds.length > 0) {
      // Query events by campaign_id or email_id
      // Supabase .or() syntax: "campaign_id.eq.value1,email_id.in.(value2,value3)"
      const { data: eventsData, error: eventsError } = await supabase
        .from('email_events')
        .select('event_type, email_id, campaign_id')
        .or(`campaign_id.eq.${campaignId},email_id.in.(${emailIds.join(',')})`)
      
      if (!eventsError && eventsData) {
        events = eventsData
      } else if (eventsError) {
        console.warn('Error fetching events:', eventsError)
        // Fallback: query by email_id only
        const { data: fallbackEvents } = await supabase
          .from('email_events')
          .select('event_type, email_id, campaign_id')
          .in('email_id', emailIds)
        
        if (fallbackEvents) {
          events = fallbackEvents
        }
      }
    } else {
      // If no emails found, try querying by campaign_id only
      const { data: campaignEvents } = await supabase
        .from('email_events')
        .select('event_type, email_id, campaign_id')
        .eq('campaign_id', campaignId)
      
      if (campaignEvents) {
        events = campaignEvents
      }
    }

    if (eventsError) {
      console.warn('Error fetching events:', eventsError)
      // Continue with email-based stats if events query fails
    }

    // Calculate statistics
    const totalSent = emails?.length || 0
    const totalDelivered = emails?.filter(e => e.status === 'delivered' || e.status === 'sent').length || 0
    
    // Count unique opens and clicks from events
    const openedEmailIds = new Set(
      events
        ?.filter(e => e.event_type === 'opened')
        .map(e => e.email_id)
        .filter(Boolean) || []
    )
    const clickedEmailIds = new Set(
      events
        ?.filter(e => e.event_type === 'clicked')
        .map(e => e.email_id)
        .filter(Boolean) || []
    )

    const totalOpened = openedEmailIds.size
    const totalClicked = clickedEmailIds.size

    // Calculate rates
    const openRate = totalDelivered > 0 
      ? Number(((totalOpened / totalDelivered) * 100).toFixed(2))
      : 0
    
    const clickRate = totalDelivered > 0
      ? Number(((totalClicked / totalDelivered) * 100).toFixed(2))
      : 0

    // Additional stats
    const totalBounced = emails?.filter(e => e.status === 'bounced').length || 0
    const totalFailed = emails?.filter(e => e.status === 'failed').length || 0

    return NextResponse.json({
      data: {
        campaign_id: campaignId,
        campaign_name: campaign.name,
        total_sent: totalSent,
        total_delivered: totalDelivered,
        total_opened: totalOpened,
        total_clicked: totalClicked,
        total_bounced: totalBounced,
        total_failed: totalFailed,
        open_rate: openRate,
        click_rate: clickRate,
        // Additional metrics
        delivery_rate: totalSent > 0 
          ? Number(((totalDelivered / totalSent) * 100).toFixed(2))
          : 0,
        bounce_rate: totalSent > 0
          ? Number(((totalBounced / totalSent) * 100).toFixed(2))
          : 0,
      },
      error: null,
    })
  } catch (error: any) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

