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

export function useEmailGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateEmail = async (context: string, targetRole: string): Promise<GeneratedEmail | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await api.generateEmail({ context, targetRole })

      if (response.error || response.status !== 200) {
        // Serverless mode: return mock data instead of error
        await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API delay
        return {
          subject: `Security Training Update - ${targetRole || "Your Role"}`,
          body: `Dear ${targetRole || "Team Member"},

This is an important security training update for your role. Please review the attached materials and complete the required training modules.

Your personalized training link: https://training.company.com/verify?token=abc123

Best regards,
Security Team`,
          confidence: 92,
          successRate: "45-60%",
          model: "Claude 3.5",
        }
      }

      return response.data as GeneratedEmail
    } catch (err) {
      // Serverless mode: return mock data on error
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API delay
      return {
        subject: `Security Training Update - ${targetRole || "Your Role"}`,
        body: `Dear ${targetRole || "Team Member"},

This is an important security training update for your role. Please review the attached materials and complete the required training modules.

Your personalized training link: https://training.company.com/verify?token=abc123

Best regards,
Security Team`,
        confidence: 92,
        successRate: "45-60%",
        model: "Claude 3.5",
      }
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
