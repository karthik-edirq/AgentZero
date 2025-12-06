"use client"

import { useState } from "react"
import { LandingPage } from "@/components/landing-page"
import { DashboardView } from "@/components/dashboard-view"
import { SWRConfig } from "swr"

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

  if (!showDashboard) {
    return <LandingPage onGetStarted={() => setShowDashboard(true)} />
  }

  return (
    <SWRConfig
      value={{
        shouldRetryOnError: false,
        errorRetryCount: 0,
        dedupingInterval: 60000,
      }}
    >
      <div className="min-h-screen bg-background">
        <DashboardView onCampaignSelect={setSelectedCampaignId} />
      </div>
    </SWRConfig>
  )
}
