"use client"

import { useState, useEffect } from "react"

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
      
      // Fetch campaign stats via API
      const url = campaignId 
        ? `/api/stats/${campaignId}`
        : '/api/metrics/dashboard'
      
      const response = await fetch(url)
      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      // If fetching single campaign stats, transform to analytics format
      if (campaignId && result.data) {
        const stats = result.data
        const metrics = {
          campaignPerformance: [{
            date: new Date().toLocaleDateString('en-US', { weekday: 'short' }),
            campaigns: 1,
            engaged: stats.total_opened || 0,
            clicked: stats.total_clicked || 0,
          }],
          activeCampaigns: 1,
          totalEmailsSent: stats.total_sent || 0,
          clickRate: stats.click_rate || 0,
          usersAtRisk: stats.total_clicked || 0,
          totalEventsToday: stats.total_opened + stats.total_clicked || 0,
          totalEventsTodayChange: "+0%",
          highPriorityAlerts: (stats.click_rate || 0) > 10 ? 1 : 0,
          avgDetectionTime: 3.2,
          avgDetectionTimePrevious: 4.5,
        }
        setAnalytics(metrics)
      } else {
        // Dashboard metrics format
        setAnalytics(result.data)
      }
      
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
      
      // Fetch email events via API
      const params = new URLSearchParams()
      if (filters?.campaignId) {
        params.append('campaignId', filters.campaignId)
      }
      params.append('limit', '100')
      
      const response = await fetch(`/api/metrics/events?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Check if response is ok
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`Server returned HTML instead of JSON (${response.status}). API route may not exist.`)
        }
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response: ${contentType}. Response: ${text.substring(0, 100)}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setEvents(result.data.events || [])
      setEventList(result.data.eventList || [])
      setError(null)
    } catch (err: any) {
      // Handle network errors gracefully
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        console.warn("Network error fetching events - server may not be running or network unavailable")
        setError("Unable to connect to server. Please check your connection.")
        return
      }
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
      
      // Fetch dashboard metrics via API
      const response = await fetch('/api/metrics/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Check if response is ok
      if (!response.ok) {
        // Check if response is HTML (error page)
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`Server returned HTML instead of JSON (${response.status}). API route may not exist.`)
        }
        throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response: ${contentType}. Response: ${text.substring(0, 100)}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setMetrics(result.data)
      setError(null)
    } catch (err: any) {
      // Handle network errors gracefully
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        console.warn("Network error fetching metrics - server may not be running or network unavailable")
        setError("Unable to connect to server. Please check your connection.")
        // Don't clear metrics on network error - keep existing data
        return
      }
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
