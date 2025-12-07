import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Fetch campaigns with organization
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        *,
        organization:organizations(*)
      `)
      .order('created_at', { ascending: false })

    if (campaignsError) throw campaignsError

    // Fetch stats from the view separately
    const { data: statsData, error: statsError } = await supabase
      .from('campaign_stats')
      .select('*')

    if (statsError) {
      console.warn('Error fetching campaign stats:', statsError)
      // Continue without stats if view doesn't exist yet
    }

    // Create a map of campaign_id -> stats
    const statsMap = new Map()
    if (statsData) {
      statsData.forEach((stat: any) => {
        statsMap.set(stat.id, stat)
      })
    }

    // Fetch emails for all campaigns
    const campaignIds = (campaignsData || []).map((c: any) => c.id)
    let emailsMap = new Map()
    
    if (campaignIds.length > 0) {
      const { data: emailsData } = await supabase
        .from('emails')
        .select(`
          *,
          recipient:recipients(*)
        `)
        .in('campaign_id', campaignIds)
        .order('sent_at', { ascending: false })

      // Group emails by campaign_id
      if (emailsData) {
        emailsData.forEach((email: any) => {
          const campaignId = email.campaign_id
          if (!emailsMap.has(campaignId)) {
            emailsMap.set(campaignId, [])
          }
          emailsMap.get(campaignId).push({
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
          })
        })
      }
    }

    // Transform data to match frontend expectations
    const campaigns = (campaignsData || []).map((campaign: any) => {
      const stats = statsMap.get(campaign.id)
      const emails = emailsMap.get(campaign.id) || []
      return {
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
    })

    return NextResponse.json({ data: campaigns, error: null })
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

    // Get or create organization
    let { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', body.organization)
      .single()

    if (!org) {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: body.organization })
        .select('id')
        .single()

      if (orgError) throw orgError
      org = newOrg
    }

    // Create campaign with explicitly generated UUID to ensure uniqueness
    // Generate UUID v4 using crypto.randomUUID() for guaranteed uniqueness
    // This ensures every campaign gets a unique ID, even if database default fails
    const campaignId = crypto.randomUUID()
    console.log('Generated campaign ID:', campaignId, 'for campaign:', body.name)
    
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        id: campaignId, // Explicitly set UUID to ensure uniqueness
        name: body.name,
        organization_id: org.id,
        business_function: body.businessFunction,
        tags: body.tags || [],
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Campaign creation error:', error)
      throw error
    }

    if (!campaign || !campaign.id) {
      console.error('Campaign created but no ID returned:', campaign)
      throw new Error('Campaign created but ID not returned')
    }

    console.log('Campaign created successfully with ID:', campaign.id)
    return NextResponse.json({ data: campaign, error: null })
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

