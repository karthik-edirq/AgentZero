"use client"

import { useState } from "react"
import { api } from "@/lib/api-client"

export interface GeneratedEmail {
  subject: string
  body: string
  confidence: number
  successRate: string
  model: string
}

export interface EmailGenerationParams {
  organization: string
  campaignName: string
  businessFunction: string
  targetRole?: string
  context?: string
  tags?: string[]
  testLink?: string
}

export function useEmailGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateEmail = async (params: EmailGenerationParams): Promise<GeneratedEmail | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await api.generateEmail(params)

      if (response.error || response.status !== 200) {
        setError(response.error || "Failed to generate email")
        return null
      }

      return response.data as GeneratedEmail
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while generating email")
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generateEmail,
    isGenerating,
    error,
  }
}
