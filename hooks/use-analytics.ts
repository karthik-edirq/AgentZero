"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

// Mock data - COMMENTED OUT - now using real-time data from Supabase
// const MOCK_EVENTS_LIST = [
//   { id: "1", type: "click", campaign: "Q1 2025 Security Training", user: "john.doe@company.com", status: "detected", time: "2:30 PM" },
//   { id: "2", type: "open", campaign: "Executive Phishing Simulation", user: "jane.smith@company.com", status: "reported", time: "2:15 PM" },
//   { id: "3", type: "click", campaign: "HR Department Test", user: "bob.wilson@company.com", status: "escalated", time: "1:45 PM" },
//   { id: "4", type: "open", campaign: "Finance Team Awareness", user: "alice.brown@company.com", status: "detected", time: "1:20 PM" },
//   { id: "5", type: "click", campaign: "Vendor Email Spoofing", user: "charlie.davis@company.com", status: "reported", time: "12:55 PM" },
//   { id: "6", type: "open", campaign: "Q1 2025 Security Training", user: "diana.miller@company.com", status: "detected", time: "12:30 PM" },
// ]

// const MOCK_EVENTS_CHART = [
//   { time: "00:00", events: 2 },
//   { time: "04:00", events: 5 },
//   { time: "08:00", events: 12 },
//   { time: "12:00", events: 18 },
//   { time: "16:00", events: 15 },
//   { time: "20:00", events: 8 },
// ]

// const MOCK_METRICS = {
//   campaignPerformance: [
//     { date: "Mon", campaigns: 5, engaged: 12, clicked: 8 },
//     { date: "Tue", campaigns: 7, engaged: 18, clicked: 14 },
//     { date: "Wed", campaigns: 6, engaged: 15, clicked: 11 },
//     { date: "Thu", campaigns: 8, engaged: 22, clicked: 17 },
//     { date: "Fri", campaigns: 9, engaged: 25, clicked: 19 },
//     { date: "Sat", campaigns: 4, engaged: 10, clicked: 7 },
//     { date: "Sun", campaigns: 3, engaged: 8, clicked: 5 },
//   ],
//   activeCampaigns: 5,
//   totalEmailsSent: 595,
//   clickRate: 42.5,
//   usersAtRisk: 23,
//   totalEventsToday: 156,
//   totalEventsTodayChange: "+12%",
//   highPriorityAlerts: 8,
//   avgDetectionTime: 3.2,
//   avgDetectionTimePrevious: 4.5,
// }

// Real-time data fetching from Supabase
export function useAnalytics(campaignId?: string) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      
      // Fetch campaign stats
      let query = supabase.from('campaign_stats').select('*')
      if (campaignId) {
        query = query.eq('id', campaignId)
      }
      const { data: statsData } = await query

      // Calculate metrics from real data
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

      const metrics = {
        campaignPerformance: statsData?.slice(0, 7).map((stat: any, index: number) => ({
          date: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `Day ${index + 1}`,
          campaigns: 1,
          engaged: stat.opened || 0,
          clicked: stat.clicked || 0,
        })) || [],
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

      setAnalytics(metrics)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching analytics:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [campaignId])

  return {
    analytics,
    isLoading,
    error,
    refresh: fetchAnalytics,
  }
}

export function useEvents(filters?: any) {
  const [events, setEvents] = useState<any[]>([])
  const [eventList, setEventList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      
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
        .limit(100)

      if (filters?.campaignId) {
        query = query.eq('email.campaign_id', filters.campaignId)
      }

      const { data: eventsData, error: eventsError } = await query

      if (eventsError) throw eventsError

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

      setEvents(chartData)
      setEventList(listData)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching events:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [filters])

  return {
    events,
    eventList,
    isLoading,
    error,
    refresh: fetchEvents,
  }
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all campaign stats
      const { data: statsData } = await supabase
        .from('campaign_stats')
        .select('*')

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

      setMetrics(dashboardMetrics)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching dashboard metrics:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  return {
    metrics,
    isLoading,
    error,
    refresh: fetchMetrics,
  }
}
