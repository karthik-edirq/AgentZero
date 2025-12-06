import { NextRequest, NextResponse } from "next/server"

export interface EmailGenerationRequest {
  organization: string
  campaignName: string
  businessFunction: string
  targetRole?: string
  context?: string
  tags?: string[]
  testLink?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailGenerationRequest = await request.json()
    const { organization, campaignName, businessFunction, targetRole, context, tags, testLink } = body

    // Validate required fields
    if (!organization || !campaignName || !businessFunction) {
      return NextResponse.json(
        { error: "Missing required fields: organization, campaignName, businessFunction" },
        { status: 400 }
      )
    }

    // Get Gemini API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables." },
        { status: 500 }
      )
    }

    // Optional: List available models for debugging (uncomment if needed)
    // const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`
    // try {
    //   const modelsResponse = await fetch(listModelsUrl)
    //   const modelsData = await modelsResponse.json()
    //   console.log("Available models:", JSON.stringify(modelsData, null, 2))
    // } catch (e) {
    //   console.log("Could not list models:", e)
    // }

    // Generate a random test link if not provided
    const randomLink = testLink || `https://training-${Math.random().toString(36).substring(2, 9)}.company.com/verify?token=${Math.random().toString(36).substring(2, 15)}`

    // Construct the prompt for Gemini
    const prompt = `You are an expert at creating realistic and effective security awareness training emails for phishing simulation campaigns.

Generate a professional phishing simulation email that:
- Appears authentic and legitimate
- Is tailored for the target audience
- Uses appropriate tone and language for the business context
- Includes realistic details that would make it convincing
- Contains a call-to-action with a link

Context Information:
- Organization: ${organization}
- Campaign Name: ${campaignName}
- Business Function: ${businessFunction}
${targetRole ? `- Target Role: ${targetRole}` : ""}
${tags && tags.length > 0 ? `- Tags: ${tags.join(", ")}` : ""}
${context ? `- Additional Context: ${context}` : ""}

IMPORTANT INSTRUCTIONS:
1. Use this EXACT test link in the email: ${randomLink}
2. Format the email body with proper line breaks using \\n for new lines
3. Make the email look professional with proper paragraphs
4. Include the link naturally in the email body
5. Do NOT include any malicious or suspicious links - only use the provided test link
6. Format the email as if it's a real business email with proper greeting, body paragraphs, and closing

Generate a phishing simulation email with:
1. A compelling subject line
2. A well-formatted email body with proper paragraphs and line breaks
3. Professional tone and structure

IMPORTANT: You must respond ONLY with valid JSON. Do not include any text before or after the JSON object.

Return the response in this exact JSON format (no markdown, no code blocks, just pure JSON):
{
  "subject": "email subject line here",
  "body": "email body content here with proper formatting. Use \\n for line breaks. Include the test link: ${randomLink}",
  "confidence": 85,
  "successRate": "45-60%",
  "model": "Gemini 2.5 Flash Lite"
}

Make the email realistic and tailored to the ${businessFunction} department at ${organization}. The email should be professional, well-formatted, and convincing.`

    // Helper function to call Gemini API with a specific model
    const callGeminiAPI = async (modelName: string, apiVersion: string = "v1beta") => {
      const geminiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${geminiApiKey}`
      
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      })

      return response
    }

    // Use Gemini 2.5 Flash Lite
    const modelName = "gemini-2.5-flash-lite"
    const apiVersion = "v1beta"
    const usedModel = "Gemini 2.5 Flash Lite"
    
    console.log(`Using model: ${modelName} with API version: ${apiVersion}`)
    const geminiResponse = await callGeminiAPI(modelName, apiVersion)

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error("Gemini API error:", errorText)
      return NextResponse.json(
        { 
          error: `Gemini API error: ${geminiResponse.statusText}. ${errorText}` 
        },
        { status: geminiResponse.status }
      )
    }

    const geminiData = await geminiResponse.json()
    
    // Extract the generated text from Gemini response
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""
    
    console.log(`Successfully generated email using ${usedModel}`)
    
    // Try to parse JSON from the response, or extract subject and body
    let emailData
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        emailData = JSON.parse(jsonMatch[0])
      } else {
        // If no JSON found, parse the text manually
        const subjectMatch = generatedText.match(/subject[":\s]+"([^"]+)"/i) || 
                            generatedText.match(/Subject[:\s]+(.+)/i)
        const bodyMatch = generatedText.match(/body[":\s]+"([^"]+)"/i) ||
                         generatedText.match(/Body[:\s]+([\s\S]+)/i)
        
        emailData = {
          subject: subjectMatch?.[1]?.trim() || "Security Training Update",
          body: bodyMatch?.[1]?.trim() || generatedText,
          confidence: 85,
          successRate: "45-60%",
          model: usedModel,
        }
      }
    } catch (parseError) {
      // Fallback: use the raw text
      const lines = generatedText.split("\n")
      emailData = {
        subject: lines[0]?.replace(/^subject[:\s]+/i, "").trim() || "Security Training Update",
        body: generatedText,
        confidence: 85,
        successRate: "45-60%",
        model: usedModel,
      }
    }

    // Format the email body properly - replace \n with actual line breaks
    let formattedBody = emailData.body || generatedText
    formattedBody = formattedBody.replace(/\\n/g, '\n')
    formattedBody = formattedBody.replace(/\\"/g, '"')
    
    // Get the subject to remove it from body if it appears
    const emailSubject = emailData.subject || "Security Training Update"
    
    // Remove subject line if it appears in the body (comprehensive removal)
    // First, remove any lines that explicitly say "Subject:"
    formattedBody = formattedBody
      .replace(/^\s*[Ss]ubject\s*:\s*.*$/gmi, '')
      .replace(/^\s*SUBJECT\s*:\s*.*$/gmi, '')
      .replace(/Subject:\s*[^\n]*/gi, '')
      .replace(/subject:\s*[^\n]*/gi, '')
    
    // Split by lines and filter more aggressively
    const bodyLines = formattedBody.split('\n')
    const cleanedLines = bodyLines.filter(line => {
      const trimmedLine = line.trim()
      // Remove lines that start with "Subject:" (case insensitive, with or without colon)
      if (/^\s*[Ss]ubject\s*:?\s*/i.test(trimmedLine)) {
        return false
      }
      // Remove lines that are exactly the subject text (common pattern)
      if (trimmedLine === emailSubject || trimmedLine.startsWith(emailSubject)) {
        return false
      }
      // Remove lines that contain "Subject:" anywhere
      if (/Subject:\s*/i.test(trimmedLine)) {
        return false
      }
      return true
    })
    formattedBody = cleanedLines.join('\n').trim()
    
    // Remove any leading/trailing empty lines
    formattedBody = formattedBody.replace(/^\n+|\n+$/g, '')
    
    // Final cleanup - remove any remaining subject patterns
    formattedBody = formattedBody
      .replace(/Subject:\s*[^\n]*\n?/gi, '')
      .replace(/subject:\s*[^\n]*\n?/gi, '')
      .replace(/^Subject:.*$/gmi, '')
      .replace(/^subject:.*$/gmi, '')
      .trim()
    
    // Ensure the test link is in the email (replace any malicious-looking links)
    if (!formattedBody.includes(randomLink)) {
      // If the link wasn't included, add it at the end
      formattedBody += `\n\nAccess your account here: ${randomLink}`
    } else {
      // Replace any suspicious links with our test link
      formattedBody = formattedBody.replace(/https?:\/\/[^\s\)]+/g, (match) => {
        // Keep the test link, replace others
        if (match.includes(randomLink.split('?')[0])) {
          return match
        }
        // Replace suspicious links with test link
        return randomLink
      })
    }

    // Ensure we have the required fields
    const response = {
      subject: emailData.subject || "Security Training Update",
      body: formattedBody,
      confidence: emailData.confidence || 85,
      successRate: emailData.successRate || "45-60%",
      model: emailData.model || usedModel,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Error generating email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate email" },
      { status: 500 }
    )
  }
}

