import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both async and sync params (Next.js 15+ uses async params)
    const resolvedParams = params instanceof Promise ? await params : params
    const campaignId = resolvedParams.id
    
    if (!campaignId || campaignId === 'undefined' || campaignId === 'null') {
      return NextResponse.json(
        { data: null, error: 'Invalid campaign ID' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Fetch campaign with organization
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', campaignId)
      .single()

    if (campaignError) {
      return NextResponse.json(
        { data: null, error: campaignError.message },
        { status: 404 }
      )
    }

    if (!campaign) {
      return NextResponse.json(
        { data: null, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch stats from the view
    const { data: statsData } = await supabase
      .from('campaign_stats')
      .select('*')
      .eq('id', campaignId)
      .single()

    const stats = statsData || {}

    // Fetch emails for this campaign
    const { data: emailsData } = await supabase
      .from('emails')
      .select(`
        *,
        recipient:recipients(*)
      `)
      .eq('campaign_id', campaignId)
      .order('sent_at', { ascending: false })

    const emails = (emailsData || []).map((email: any) => ({
      id: email.id,
      status: email.status,
      recipient: email.recipient?.email || 'Unknown',
      subject: email.subject,
      body: email.body || '',
      sentAt: email.sent_at
        ? new Date(email.sent_at).toLocaleTimeString()
        : null,
      sent_at: email.sent_at,
      delivered_at: email.delivered_at,
      opened_at: email.opened_at,
      clicked_at: email.clicked_at,
    }))

    // Transform data to match frontend expectations
    const campaignData = {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      organization: campaign.organization?.name || '',
      businessFunction: campaign.business_function || '',
      tags: campaign.tags || [],
      totalSent: stats?.total_sent || 0,
      sent: stats?.total_sent || 0,
      delivered: stats?.delivered || 0,
      opened: stats?.opened || 0,
      clicked: stats?.clicked || 0,
      openRate: stats?.open_rate || 0,
      clickRate: stats?.click_rate || 0,
      createdAt: campaign.created_at,
      emails, // Include emails in response
    }

    return NextResponse.json({ data: campaignData, error: null })
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both async and sync params (Next.js 15+ uses async params)
    const resolvedParams = params instanceof Promise ? await params : params
    const campaignId = resolvedParams.id
    
    if (!campaignId || campaignId === 'undefined' || campaignId === 'null') {
      return NextResponse.json(
        { data: null, error: 'Invalid campaign ID' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { data: null, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Delete campaign (cascading deletes will handle related records)
    // Foreign keys with ON DELETE CASCADE will automatically delete:
    // - campaign_recipients
    // - emails (and their email_events)
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)

    if (deleteError) {
      console.error('Error deleting campaign:', deleteError)
      return NextResponse.json(
        { data: null, error: deleteError.message },
        { status: 500 }
      )
    }

    console.log(`Campaign deleted successfully: ${campaignId} (${campaign.name})`)
    return NextResponse.json({ 
      data: { id: campaignId, name: campaign.name },
      error: null 
    })
  } catch (error: any) {
    console.error('Delete campaign error:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

