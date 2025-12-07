import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * Dashboard Metrics API
 * Returns aggregate metrics for all campaigns
 * 
 * GET /api/metrics/dashboard
 */
export async function GET() {
  try {
    const supabase = createServerClient()

    // Fetch all campaign stats from the view
    const { data: statsData, error: statsError } = await supabase
      .from('campaign_stats')
      .select('*')

    if (statsError) {
      console.error('Error fetching campaign stats:', statsError)
      // Return empty metrics if view doesn't exist or has errors
      return NextResponse.json({
        data: {
          campaignPerformance: [],
          activeCampaigns: 0,
          totalEmailsSent: 0,
          clickRate: 0,
          usersAtRisk: 0,
          totalEventsToday: 0,
          totalEventsTodayChange: "+0%",
          highPriorityAlerts: 0,
          avgDetectionTime: 3.2,
          avgDetectionTimePrevious: 4.5,
        },
        error: null,
      })
    }

    // Calculate aggregate metrics
    const totalEmailsSent = statsData?.reduce((sum: number, stat: any) => sum + (stat.total_sent || 0), 0) || 0
    const totalOpened = statsData?.reduce((sum: number, stat: any) => sum + (stat.opened || 0), 0) || 0
    const totalClicked = statsData?.reduce((sum: number, stat: any) => sum + (stat.clicked || 0), 0) || 0
    const activeCampaigns = statsData?.filter((stat: any) => stat.status === 'active').length || 0
    const avgClickRate = statsData?.length > 0 
      ? statsData.reduce((sum: number, stat: any) => sum + (stat.click_rate || 0), 0) / statsData.length 
      : 0

    // Fetch events for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data: eventsToday } = await supabase
      .from('email_events')
      .select('*')
      .gte('created_at', today.toISOString())

    // Generate weekly performance data
    const weeklyData = []
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStats = statsData?.filter((stat: any) => {
        const statDate = new Date(stat.created_at || 0)
        return statDate.toDateString() === date.toDateString()
      }) || []
      
      weeklyData.push({
        date: days[date.getDay()],
        campaigns: dayStats.length,
        engaged: dayStats.reduce((sum: number, s: any) => sum + (s.opened || 0), 0),
        clicked: dayStats.reduce((sum: number, s: any) => sum + (s.clicked || 0), 0),
      })
    }

    const dashboardMetrics = {
      campaignPerformance: weeklyData,
      activeCampaigns,
      totalEmailsSent,
      clickRate: avgClickRate,
      usersAtRisk: totalClicked,
      totalEventsToday: eventsToday?.length || 0,
      totalEventsTodayChange: "+0%",
      highPriorityAlerts: statsData?.filter((stat: any) => (stat.click_rate || 0) > 10).length || 0,
      avgDetectionTime: 3.2,
      avgDetectionTimePrevious: 4.5,
    }

    return NextResponse.json({
      data: dashboardMetrics,
      error: null,
    })
  } catch (error: any) {
    console.error('Dashboard metrics API error:', error)
    return NextResponse.json(
      { 
        data: null, 
        error: error.message || 'Failed to fetch dashboard metrics' 
      },
      { status: 500 }
    )
  }
}

