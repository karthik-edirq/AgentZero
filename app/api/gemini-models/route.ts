import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      )
    }

    // Try to list models from v1beta
    const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`
    const response = await fetch(listModelsUrl)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: "Failed to list models",
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Check your API key and ensure Gemini API is enabled in Google Cloud Console"
      },
      { status: 500 }
    )
  }
}

