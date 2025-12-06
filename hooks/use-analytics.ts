"use client"

// Mock data - using serverless/mock mode (no API calls)
const MOCK_EVENTS_LIST = [
  { id: "1", type: "click", campaign: "Q1 2025 Security Training", user: "john.doe@company.com", status: "detected", time: "2:30 PM" },
  { id: "2", type: "open", campaign: "Executive Phishing Simulation", user: "jane.smith@company.com", status: "reported", time: "2:15 PM" },
  { id: "3", type: "click", campaign: "HR Department Test", user: "bob.wilson@company.com", status: "escalated", time: "1:45 PM" },
  { id: "4", type: "open", campaign: "Finance Team Awareness", user: "alice.brown@company.com", status: "detected", time: "1:20 PM" },
  { id: "5", type: "click", campaign: "Vendor Email Spoofing", user: "charlie.davis@company.com", status: "reported", time: "12:55 PM" },
  { id: "6", type: "open", campaign: "Q1 2025 Security Training", user: "diana.miller@company.com", status: "detected", time: "12:30 PM" },
]

const MOCK_EVENTS_CHART = [
  { time: "00:00", events: 2 },
  { time: "04:00", events: 5 },
  { time: "08:00", events: 12 },
  { time: "12:00", events: 18 },
  { time: "16:00", events: 15 },
  { time: "20:00", events: 8 },
]

const MOCK_METRICS = {
  campaignPerformance: [
    { date: "Mon", campaigns: 5, engaged: 12, clicked: 8 },
    { date: "Tue", campaigns: 7, engaged: 18, clicked: 14 },
    { date: "Wed", campaigns: 6, engaged: 15, clicked: 11 },
    { date: "Thu", campaigns: 8, engaged: 22, clicked: 17 },
    { date: "Fri", campaigns: 9, engaged: 25, clicked: 19 },
    { date: "Sat", campaigns: 4, engaged: 10, clicked: 7 },
    { date: "Sun", campaigns: 3, engaged: 8, clicked: 5 },
  ],
  activeCampaigns: 5,
  totalEmailsSent: 595,
  clickRate: 42.5,
  usersAtRisk: 23,
  totalEventsToday: 156,
  totalEventsTodayChange: "+12%",
  highPriorityAlerts: 8,
  avgDetectionTime: 3.2,
  avgDetectionTimePrevious: 4.5,
}

// Serverless mode - return mock data directly without API calls
export function useAnalytics(campaignId?: string) {
  return {
    analytics: MOCK_METRICS,
    isLoading: false,
    error: null,
    refresh: () => Promise.resolve(),
  }
}

export function useEvents(filters?: any) {
  return {
    events: MOCK_EVENTS_CHART,
    eventList: MOCK_EVENTS_LIST,
    isLoading: false,
    error: null,
    refresh: () => Promise.resolve(),
  }
}

export function useDashboardMetrics() {
  return {
    metrics: MOCK_METRICS,
    isLoading: false,
    error: null,
    refresh: () => Promise.resolve(),
  }
}
