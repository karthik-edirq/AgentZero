"use client"

import { useState } from "react"
import { DashboardView } from "@/components/dashboard-view"
import { CampaignView } from "@/components/campaign-view"
import { EmailGeneratorView } from "@/components/email-generator-view"
import { SWRConfig } from "swr"

export default function Home() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

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
