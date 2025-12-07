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

    const prompt = `You are an expert email writer specializing in security awareness and phishing simulation campaigns. Generate a personalized, professional email that:

1. Is contextually relevant to the target role: ${params.targetRole}
2. Uses the provided context: ${params.context}
3. ${params.recipientName ? `Is personalized for: ${params.recipientName}` : ''}
4. ${params.organization ? `Is relevant to organization: ${params.organization}` : ''}
5. ${params.businessFunction ? `Is relevant to business function: ${params.businessFunction}` : ''}
6. Appears legitimate and professional
7. Is appropriate for a security awareness training campaign

Generate the email in the following JSON format:
{
  "subject": "Email subject line",
  "body": "Email body in HTML format",
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

