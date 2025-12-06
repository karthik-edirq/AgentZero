const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export interface ApiResponse<T> {
  data: T
  error?: string
  status: number
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })

    const data = await response.json()

    return {
      data: data as T,
      status: response.status,
      error: !response.ok ? data.error : undefined,
    }
  } catch (error) {
    return {
      data: [] as unknown as T,
      status: 500,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

export const api = {
  // Campaigns
  getCampaigns: () => apiCall("/campaigns"),
  getCampaign: (id: string) => apiCall(`/campaigns/${id}`),
  createCampaign: (data: any) => apiCall("/campaigns", { method: "POST", body: JSON.stringify(data) }),
  updateCampaign: (id: string, data: any) =>
    apiCall(`/campaigns/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCampaign: (id: string) => apiCall(`/campaigns/${id}`, { method: "DELETE" }),

  // Email Generation
  generateEmail: (data: { context: string; targetRole: string }) =>
    apiCall("/email-generator", { method: "POST", body: JSON.stringify(data) }),

  // Analytics & Events
  getEvents: (filters?: any) => {
    const params = new URLSearchParams(filters)
    return apiCall(`/events?${params.toString()}`)
  },
  getAnalytics: (campaignId?: string) => {
    const endpoint = campaignId ? `/analytics?campaignId=${campaignId}` : "/analytics"
    return apiCall(endpoint)
  },

  // Dashboard Metrics
  getDashboardMetrics: () => apiCall("/dashboard/metrics"),
}

export default api
