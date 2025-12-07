import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendBatchEmails, type BatchEmailItem } from '@/lib/resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both async and sync params (Next.js 15+ uses async params)
    const resolvedParams = params instanceof Promise ? await params : params
    const campaignId = resolvedParams.id
    
    if (!campaignId || campaignId === 'undefined' || campaignId === 'null') {
      console.error('Invalid campaign ID received:', campaignId, 'Type:', typeof campaignId)
      return NextResponse.json(
        { error: `Invalid campaign ID: ${campaignId}` },
        { status: 400 }
      )
    }
    
    console.log('Launching campaign with ID:', campaignId, 'Type:', typeof campaignId)
    const supabase = createServerClient()

    // Get campaign details with retry logic (campaign might not be immediately visible after creation)
    let campaign = null
    let campaignError = null
    let retries = 0
    const maxRetries = 10
    const retryDelay = 300 // ms

    while (retries < maxRetries) {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', campaignId)
        .single()

      if (!error && data) {
        campaign = data
        campaignError = null
        break
      }

      campaignError = error
      retries++
      
      if (retries < maxRetries) {
        console.log(`Campaign not found, retrying... (${retries}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      }
    }

    if (campaignError || !campaign) {
      console.error('Campaign fetch error after retries:', campaignError)
      return NextResponse.json(
        { error: `Campaign not found: ${campaignError?.message || 'Campaign does not exist'}` },
        { status: 404 }
      )
    }

    // Fetch recipients based on organization and business function
    let recipientsQuery = supabase
      .from('recipients')
      .select('*')
      .eq('organization_id', campaign.organization_id)

    if (campaign.business_function && campaign.business_function !== 'all') {
      recipientsQuery = recipientsQuery.eq('business_function', campaign.business_function)
    }

    const { data: recipients, error: recipientsError } = await recipientsQuery

    if (recipientsError) {
      throw recipientsError
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found for this campaign' },
        { status: 400 }
      )
    }

    // Link recipients to campaign
    const campaignRecipients = recipients.map((recipient: any) => ({
      campaign_id: campaignId,
      recipient_id: recipient.id,
    }))

    await supabase
      .from('campaign_recipients')
      .upsert(campaignRecipients, {
        onConflict: 'campaign_id,recipient_id',
        ignoreDuplicates: true,
      })

    // Step 1: Generate personalized emails for all recipients using Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    interface GeneratedEmail {
      recipient: any
      subject: string
      body: string
      formattedHtml: string
    }

    const generatedEmails: GeneratedEmail[] = []
    const generationErrors: Array<{ recipient: string; error: string }> = []

    // Generate emails for all recipients
    for (const recipient of recipients) {
      try {
        // Build tags context with emphasis
        const tagsContext = campaign.tags && campaign.tags.length > 0
          ? `\n\n*** CRITICAL: CAMPAIGN TAGS (HIGH PRIORITY - USE THESE TO SHAPE THE EMAIL) ***
${campaign.tags.map((tag: string, idx: number) => `  ${idx + 1}. ${tag}`).join('\n')}

These tags define the PRIMARY theme, style, and purpose of this phishing simulation campaign.
The email MUST align with and reflect these tags. Use them to determine:
- The type of phishing attack to simulate (e.g., "invoice", "password-reset", "urgent-action")
- The urgency level and tone
- The specific scenario or pretext
- The call-to-action and link context

IMPORTANT: The tags are the MOST IMPORTANT factor in determining the email content.`
          : ''

        const prompt = `You are an expert at creating realistic and effective security awareness training emails for phishing simulation campaigns that will pass spam filters and reach recipients' inboxes.

Generate a professional phishing simulation email that:
- Appears authentic and legitimate
- Is tailored for: ${recipient.role || recipient.business_function || 'employee'}
- Uses appropriate tone and language for the business context
- Includes realistic details that would make it convincing
- Contains a call-to-action with a clickable link
- Will pass spam filters and deliverability checks${tagsContext}

CRITICAL SPAM AVOIDANCE GUIDELINES:
1. AVOID spam trigger words and phrases:
   - Do NOT use: "urgent", "act now", "click here immediately", "limited time", "free", "guaranteed", "no risk", "winner", "congratulations", "prize", "claim now", "expires soon"
   - Instead use: "please review", "when you have a moment", "at your convenience", "update required", "action needed"

2. Subject line best practices:
   - Keep it under 50 characters
   - Use proper capitalization (sentence case, not ALL CAPS)
   - Avoid excessive punctuation (no multiple exclamation marks)
   - Make it specific and relevant to the business function
   - Use natural language, not marketing-speak

3. Email body best practices:
   - Use proper grammar, spelling, and punctuation
   - Write in a natural, conversational business tone
   - Include proper greeting and professional closing
   - Use proper paragraph structure (2-4 sentences per paragraph)
   - Avoid excessive formatting (no bold/italic spam patterns)
   - Maintain a good text-to-link ratio (more text than links)
   - Use complete sentences, not fragments

4. Link placement and wording:
   - Embed the link naturally in context, not as standalone "Click here"
   - Use descriptive link text that matches the context
   - Place links in the middle or end of paragraphs, not at the start
   - Avoid suspicious link patterns (no URL shorteners, no IP addresses)

5. Professional email structure:
   - Start with appropriate greeting (Hi, Hello, Dear [Name/Team])
   - Provide context and background information
   - Explain the reason for the email naturally
   - Include the link as part of a complete sentence
   - End with professional closing and signature

Context Information:
- Organization: ${campaign.organization?.name || 'Company'}
- Campaign Name: ${campaign.name}
- Business Function: ${campaign.business_function || 'General'}
- Target Role: ${recipient.role || 'Employee'}
- Recipient Name: ${recipient.name || 'Team Member'}

Generate a phishing simulation email with:
1. A professional, spam-filter-friendly subject line (under 50 chars, proper capitalization, no spam words) that aligns with the campaign tags
2. A well-formatted email body with proper paragraphs and line breaks
3. Professional tone and structure that matches the campaign theme
4. A clickable link that fits the scenario (use a realistic-looking URL) embedded naturally in the text

CRITICAL: The email body MUST include at least one clickable link. Format it as:
- Markdown format: [descriptive text](https://example.com/link) - use descriptive text, NOT "Click here"
- Or plain URL: https://example.com/link
- The link should be relevant to the phishing scenario (e.g., password reset, invoice payment, document verification)
- Embed the link naturally within a complete sentence

IMPORTANT: You must respond ONLY with valid JSON. Do not include any text before or after the JSON object.

Return the response in this exact JSON format:
{
  "subject": "email subject line here",
  "body": "email body content here with proper formatting. Use \\n for line breaks. MUST include at least one clickable link in markdown format [descriptive text](url) or as plain URL https://example.com. Embed links naturally within sentences.",
  "confidence": 85,
  "successRate": "45-60%",
  "model": "Gemini 2.5 Flash Lite"
}`

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`
        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        })

        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.statusText}`)
        }

        const geminiData = await geminiResponse.json()
        const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

        // Parse JSON from response
        let emailData
        try {
          const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            emailData = JSON.parse(jsonMatch[0])
          } else {
            emailData = {
              subject: 'Security Training Update',
              body: generatedText,
              confidence: 85,
              successRate: '45-60%',
              model: 'Gemini 2.5 Flash Lite',
            }
          }
        } catch {
          emailData = {
            subject: 'Security Training Update',
            body: generatedText,
            confidence: 85,
            successRate: '45-60%',
            model: 'Gemini 2.5 Flash Lite',
          }
        }

        // Format body - replace \n with actual line breaks
        let formattedBody = (emailData.body || generatedText)
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')

        // Step 1: Convert markdown links [text](url) to HTML <a> tags
        formattedBody = formattedBody.replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" style="color: #0066cc; text-decoration: underline;">$1</a>'
        )

        // Step 2: Split body into parts (text and existing HTML tags)
        // This helps us avoid converting URLs that are already in <a> tags
        const parts: Array<{ type: 'text' | 'html'; content: string }> = []
        let currentIndex = 0
        const htmlTagRegex = /<a\s+[^>]*>.*?<\/a>/gi
        
        let match
        while ((match = htmlTagRegex.exec(formattedBody)) !== null) {
          // Add text before the HTML tag
          if (match.index > currentIndex) {
            parts.push({
              type: 'text',
              content: formattedBody.substring(currentIndex, match.index)
            })
          }
          // Add the HTML tag as-is
          parts.push({
            type: 'html',
            content: match[0]
          })
          currentIndex = match.index + match[0].length
        }
        // Add remaining text
        if (currentIndex < formattedBody.length) {
          parts.push({
            type: 'text',
            content: formattedBody.substring(currentIndex)
          })
        }

        // Step 3: Convert plain URLs in text parts to clickable links
        const processedParts = parts.map(part => {
          if (part.type === 'html') {
            return part.content // Keep HTML tags as-is
          }
          
          // Convert URLs in text parts - improved regex to catch more URL patterns
          // Match http:// or https:// followed by valid URL characters
          return part.content.replace(
            /(https?:\/\/[^\s<>"{}|\\^`\[\]\n\r]+)/gi,
            (url) => {
              // Remove trailing punctuation that shouldn't be part of URL
              url = url.replace(/[.,;!?]+$/, '')
              // Create a clickable link
              const linkText = url.length > 60 ? url.substring(0, 57) + '...' : url
              return `<a href="${url}" style="color: #0066cc; text-decoration: underline;">${linkText}</a>`
            }
          )
        })

        // Reconstruct body
        formattedBody = processedParts.join('')

        // Step 4: Check if there are any links in the body
        const hasLinks = /<a\s+href=/i.test(formattedBody)
        
        // If no links found, add a default phishing simulation link
        if (!hasLinks) {
          const defaultLink = `https://training-${Math.random().toString(36).substring(2, 9)}.company.com/verify?token=${Math.random().toString(36).substring(2, 15)}`
          formattedBody += `\n\n<a href="${defaultLink}" style="color: #0066cc; text-decoration: underline; font-weight: 500;">Click here to verify your account</a>`
          console.log(`⚠️ No links found in generated email, added default link: ${defaultLink}`)
        }

        // Step 5: Convert newlines to <br> tags
        // Anchor tags don't contain newlines, so we can safely replace all newlines
        let formattedHtml = formattedBody.replace(/\n/g, '<br>').trim()
        
        // Wrap in basic HTML structure for Resend
        // Resend expects valid HTML with proper link tracking
        formattedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  ${formattedHtml}
</body>
</html>`
        
        // Count and log links
        const linkCount = (formattedHtml.match(/<a\s+href=/gi) || []).length
        console.log(`📧 Generated email for ${recipient.email}`)
        console.log(`🔗 Clickable links found: ${linkCount}`)
        if (linkCount > 0) {
          const linkMatches = formattedHtml.match(/<a\s+href="([^"]+)"/gi) || []
          const urls = linkMatches.map(l => {
            const urlMatch = l.match(/href="([^"]+)"/i)
            return urlMatch ? urlMatch[1] : ''
          }).filter(Boolean)
          console.log(`   Link URLs: ${urls.join(', ')}`)
        } else {
          console.error(`❌ ERROR: No clickable links found in email for ${recipient.email} - email may not be trackable!`)
        }

        generatedEmails.push({
          recipient,
          subject: emailData.subject || 'Security Training Update',
          body: formattedBody,
          formattedHtml,
        })
      } catch (error: any) {
        generationErrors.push({
          recipient: recipient.email,
          error: error.message,
        })
      }
    }

    // Step 2: Batch send all generated emails via Resend Batch API
    // Reference: https://resend.com/docs/api-reference/emails/send-batch-emails
    // Include tracking tags (userId, campaignId) for webhook event tracking
    const batchEmailItems: BatchEmailItem[] = generatedEmails.map((email) => ({
      to: email.recipient.email,
      subject: email.subject,
      html: email.formattedHtml,
      userId: email.recipient.id, // Use recipient ID as userId
      campaignId: campaignId, // Campaign ID for tracking
    }))

    const batchResult = await sendBatchEmails(batchEmailItems, {
      validationMode: 'permissive', // Allow partial success
    })

    // Step 3: Save email records to database and create events
    const results = []
    const processedRecipients = new Set<string>()
    
    // Process successful sends
    for (let i = 0; i < batchResult.data.length; i++) {
      const batchItem = batchResult.data[i]
      const emailIndex = batchItem.index
      
      if (batchItem.id && emailIndex < generatedEmails.length) {
        const generatedEmail = generatedEmails[emailIndex]
        processedRecipients.add(generatedEmail.recipient.email)
        
        try {
          // Save email record to database with 'sent' status
          // IMPORTANT: resend_email_id must match the ID from Resend webhook events
          console.log(`Saving email record with resend_email_id: ${batchItem.id} for recipient: ${generatedEmail.recipient.email}`)
          
          const { data: emailRecord, error: insertError } = await supabase
            .from('emails')
            .insert({
              campaign_id: campaignId,
              recipient_id: generatedEmail.recipient.id,
              subject: generatedEmail.subject,
              body: generatedEmail.body,
              status: 'sent',
              resend_email_id: batchItem.id, // This must match webhook event.data.email_id
              sent_at: new Date().toISOString(),
            })
            .select()
            .single()
          
          if (insertError) {
            console.error(`Error saving email for ${generatedEmail.recipient.email}:`, insertError)
          } else {
            console.log(`Email saved successfully:`, { 
              emailId: emailRecord?.id, 
              resendEmailId: batchItem.id,
              recipient: generatedEmail.recipient.email 
            })
          }

          if (insertError) {
            console.error(`Error saving email record for ${generatedEmail.recipient.email}:`, insertError)
            results.push({
              recipient: generatedEmail.recipient.email,
              status: 'failed',
              error: `Database error: ${insertError.message}`,
            })
            continue
          }

          if (emailRecord) {
            await supabase.from('email_events').insert({
              email_id: emailRecord.id,
              event_type: 'sent',
              raw: { resend_id: batchItem.id, source: 'batch_send' },
            })
          }

          results.push({
            recipient: generatedEmail.recipient.email,
            status: 'sent',
            emailId: emailRecord?.id,
            resendId: batchItem.id,
          })
        } catch (error: any) {
          console.error(`Error processing email for ${generatedEmail.recipient.email}:`, error)
          results.push({
            recipient: generatedEmail.recipient.email,
            status: 'failed',
            error: `Database error: ${error.message}`,
          })
        }
      }
    }

    // Process batch send errors - save failed emails to database
    for (const batchError of batchResult.errors || []) {
      const emailIndex = batchError.index
      if (emailIndex < generatedEmails.length) {
        const generatedEmail = generatedEmails[emailIndex]
        processedRecipients.add(generatedEmail.recipient.email)
        
        // Check if we already have a result for this recipient
        const existingResult = results.find((r) => r.recipient === generatedEmail.recipient.email)
        if (!existingResult) {
          try {
            // Save failed email record to database
            const { data: emailRecord, error: insertError } = await supabase
              .from('emails')
              .insert({
                campaign_id: campaignId,
                recipient_id: generatedEmail.recipient.id,
                subject: generatedEmail.subject,
                body: generatedEmail.body,
                status: 'failed',
                sent_at: new Date().toISOString(),
              })
              .select()
              .single()

            if (emailRecord) {
              await supabase.from('email_events').insert({
                email_id: emailRecord.id,
                event_type: 'sent',
                raw: { 
                  error: batchError.message,
                  error_index: batchError.index,
                  source: 'batch_send_error'
                },
              })
            }

            results.push({
              recipient: generatedEmail.recipient.email,
              status: 'failed',
              error: `Batch send error: ${batchError.message}`,
              emailId: emailRecord?.id,
            })
          } catch (error: any) {
            console.error(`Error saving failed email for ${generatedEmail.recipient.email}:`, error)
            results.push({
              recipient: generatedEmail.recipient.email,
              status: 'failed',
              error: `Batch send error: ${batchError.message} (DB save failed: ${error.message})`,
            })
          }
        }
      }
    }

    // Process generation errors - save failed emails to database
    for (const genError of generationErrors) {
      if (!processedRecipients.has(genError.recipient)) {
        processedRecipients.add(genError.recipient)
        
        // Find the recipient in generatedEmails to get full details
        const recipientInfo = recipients.find((r: any) => r.email === genError.recipient)
        
        if (recipientInfo) {
          try {
            // Save failed email record to database
            const { data: emailRecord } = await supabase
              .from('emails')
              .insert({
                campaign_id: campaignId,
                recipient_id: recipientInfo.id,
                subject: 'Email Generation Failed',
                body: '',
                status: 'failed',
                sent_at: new Date().toISOString(),
              })
              .select()
              .single()

            if (emailRecord) {
              await supabase.from('email_events').insert({
                email_id: emailRecord.id,
                event_type: 'sent',
                raw: { 
                  error: genError.error,
                  source: 'generation_error'
                },
              })
            }

            results.push({
              recipient: genError.recipient,
              status: 'failed',
              error: `Email generation failed: ${genError.error}`,
              emailId: emailRecord?.id,
            })
          } catch (error: any) {
            console.error(`Error saving generation error for ${genError.recipient}:`, error)
            results.push({
              recipient: genError.recipient,
              status: 'failed',
              error: `Email generation failed: ${genError.error}`,
            })
          }
        } else {
          results.push({
            recipient: genError.recipient,
            status: 'failed',
            error: `Email generation failed: ${genError.error}`,
          })
        }
      }
    }

    // Update campaign status to active
    await supabase
      .from('campaigns')
      .update({
        status: 'active',
        launched_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    const sentCount = results.filter((r) => r.status === 'sent').length
    const failedCount = results.filter((r) => r.status === 'failed').length

    // Log summary for debugging
    console.log(`Campaign launch summary: ${sentCount} sent, ${failedCount} failed out of ${recipients.length} total`)

    return NextResponse.json({
      data: {
        campaignId,
        totalRecipients: recipients.length,
        results, // Include full results array with error details
        sent: sentCount,
        failed: failedCount,
      },
      error: null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

