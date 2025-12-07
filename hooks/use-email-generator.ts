"use client"

import { useState } from "react"

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

  const generateEmail = async (
    context: string,
    targetRole: string,
    recipientName?: string,
    organization?: string,
    businessFunction?: string
  ): Promise<GeneratedEmail | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/email-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context,
          targetRole,
          recipientName,
          organization,
          businessFunction,
        }),
      })

      const result = await response.json()

      if (result.error || !result.data) {
        throw new Error(result.error || "Failed to generate email")
      }

      return result.data as GeneratedEmail
    } catch (err: any) {
      setError(err.message)
      console.error("Error generating email:", err)
      // Fallback email only returned on error - COMMENTED OUT for production
      // In production, you may want to return null and show error to user
      // return {
      //   subject: `Security Training Update - ${targetRole || "Your Role"}`,
      //   body: `Dear ${recipientName || targetRole || "Team Member"},
      //
      // This is an important security training update for your role. Please review the attached materials and complete the required training modules.
      //
      // Your personalized training link: https://training.company.com/verify?token=abc123
      //
      // Best regards,
      // Security Team`,
      //   confidence: 85,
      //   successRate: "45-60%",
      //   model: "gemini-pro",
      // }
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
