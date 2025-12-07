import { GoogleGenerativeAI } from '@google/generative-ai'

const geminiApiKey = process.env.GEMINI_API_KEY

if (!geminiApiKey) {
  throw new Error('Missing GEMINI_API_KEY environment variable')
}

const genAI = new GoogleGenerativeAI(geminiApiKey)

export interface GenerateEmailParams {
  context: string
  targetRole: string
  recipientName?: string
  organization?: string
  businessFunction?: string
}

export async function generateEmail(params: GenerateEmailParams) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `You are an expert email writer specializing in security awareness and phishing simulation campaigns that will pass spam filters and reach recipients' inboxes. Generate a personalized, professional email that:

1. Is contextually relevant to the target role: ${params.targetRole}
2. Uses the provided context: ${params.context}
3. ${params.recipientName ? `Is personalized for: ${params.recipientName}` : ''}
4. ${params.organization ? `Is relevant to organization: ${params.organization}` : ''}
5. ${params.businessFunction ? `Is relevant to business function: ${params.businessFunction}` : ''}
6. Appears legitimate and professional
7. Is appropriate for a security awareness training campaign
8. Will pass spam filters and deliverability checks

CRITICAL SPAM AVOIDANCE GUIDELINES:
- AVOID spam trigger words: "urgent", "act now", "click here immediately", "limited time", "free", "guaranteed", "winner", "congratulations", "prize", "claim now", "expires soon"
- Use natural language: "please review", "when you have a moment", "at your convenience", "update required"
- Subject line: Keep under 50 characters, use proper capitalization (sentence case), avoid excessive punctuation
- Email body: Use proper grammar, natural conversational tone, proper paragraph structure, complete sentences
- Link placement: Embed links naturally in context within complete sentences, not as standalone "Click here"
- Professional structure: Include proper greeting, context, explanation, and professional closing

Generate the email in the following JSON format:
{
  "subject": "Email subject line (under 50 chars, no spam words, proper capitalization)",
  "body": "Email body in HTML format with proper structure, natural language, and embedded links",
  "confidence": 0.95,
  "model": "gemini-pro"
}

Return only the JSON, no additional text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from Gemini response')
    }

    const emailData = JSON.parse(jsonMatch[0])

    return {
      success: true,
      data: {
        subject: emailData.subject,
        body: emailData.body,
        confidence: emailData.confidence || 0.9,
        successRate: `${Math.round((emailData.confidence || 0.9) * 100)}%`,
        model: emailData.model || 'gemini-pro',
      },
      error: null,
    }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to generate email',
    }
  }
}

