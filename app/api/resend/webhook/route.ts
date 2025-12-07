import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import crypto from 'crypto'

/**
 * Resend Webhook Handler
 * Receives webhook events from Resend and stores them in email_events table
 * 
 * Webhook events: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
 * 
 * Reference: https://resend.com/docs/webhooks/introduction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('resend-signature')
    
    // Log webhook receipt (helps debug if webhook is being called)
    console.log('🔔 Webhook POST received at:', new Date().toISOString())
    console.log('📍 Request origin:', request.headers.get('host'))
    console.log('🔑 Signature present:', !!signature)
    
    // Verify webhook signature (optional but recommended for production)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const event = JSON.parse(body)
    const supabase = createServerClient()

    // Log incoming webhook for debugging
    console.log('🔔 Resend webhook received:', {
      type: event.type,
      timestamp: new Date().toISOString(),
      eventData: event.data,
      fullEvent: JSON.stringify(event, null, 2),
    })
    
    // Special logging for open events
    if (event.type === 'email.opened') {
      console.log('👁️ OPEN EVENT DETECTED:', {
        emailId: event.data?.email_id,
        recipient: event.data?.to || event.data?.email,
        openedAt: event.data?.timestamp || event.created_at || new Date().toISOString(),
        userAgent: event.data?.user_agent || 'Unknown',
        ipAddress: event.data?.ip || 'Unknown',
        fullOpenData: JSON.stringify(event.data, null, 2),
      })
    }
    
    // Special logging for click events
    if (event.type === 'email.clicked') {
      console.log('🖱️ CLICK EVENT DETECTED:', {
        emailId: event.data?.email_id,
        recipient: event.data?.to || event.data?.email,
        link: event.data?.link || event.data?.url || event.data?.clicked_link || 'No link in payload',
        clickedAt: event.data?.timestamp || event.created_at || new Date().toISOString(),
        fullClickData: JSON.stringify(event.data, null, 2),
      })
    }

    // Extract event data according to Resend webhook format
    // Resend webhook structure: { type: 'email.sent', data: { email_id: '...', to: '...', tags: [...] } }
    const eventType = event.type // email.sent, email.delivered, email.opened, email.clicked, etc.
    
    // Resend uses 'email_id' in webhook payload
    const emailId = event.data?.email_id || event.data?.id || event.email_id
    const recipient = event.data?.to || event.data?.email || event.to || ''
    
    // Extract tags from event (userId, campaignId) - fallback if email record not found
    // Tags are stored in event.data.tags array: [{ name: 'userId', value: '...' }, ...]
    const tags = event.data?.tags || event.tags || []
    let userId: string | null = null
    let campaignId: string | null = null
    
    // Try to extract from tags first (if available)
    if (Array.isArray(tags) && tags.length > 0) {
      const userIdTag = tags.find((tag: any) => tag?.name === 'userId' || tag?.name === 'userId')
      const campaignIdTag = tags.find((tag: any) => tag?.name === 'campaignId' || tag?.name === 'campaignId')
      userId = userIdTag?.value || null
      campaignId = campaignIdTag?.value || null
    }

    console.log('Extracted webhook data:', {
      eventType,
      emailId,
      recipient,
      userIdFromTags: userId,
      campaignIdFromTags: campaignId,
      tagsCount: Array.isArray(tags) ? tags.length : 0,
    })

    // Map Resend event types to our event types
    const eventTypeMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.unsubscribed': 'unsubscribed',
    }

    const mappedEventType = eventTypeMap[eventType] || eventType.replace('email.', '')

    // Find the email record by Resend email ID
    // Try multiple lookup strategies in case webhook arrives before DB save completes
    let emailRecordId: string | null = null
    if (emailId) {
      console.log(`🔍 Looking up email record with resend_email_id: ${emailId}`)
      
      // Debug: Check what resend_email_id values exist in database
      const { data: recentEmails } = await supabase
        .from('emails')
        .select('id, resend_email_id, status, campaign_id')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('📧 Recent emails in DB:', recentEmails?.map(e => ({
        id: e.id,
        resend_email_id: e.resend_email_id,
        status: e.status,
        matches: e.resend_email_id === emailId,
      })))
      
      // Strategy 1: Direct lookup by resend_email_id
      let { data: emailRecord, error: lookupError } = await supabase
        .from('emails')
        .select('id, resend_email_id, campaign_id, recipient_id, status')
        .eq('resend_email_id', emailId)
        .single()

      // Strategy 2: If not found, try with retry (webhook might arrive before DB save)
      if (lookupError || !emailRecord) {
        console.log('Email not found on first try, retrying...')
        await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms
        
        const retryResult = await supabase
          .from('emails')
          .select('id, resend_email_id, campaign_id, recipient_id')
          .eq('resend_email_id', emailId)
          .single()
        
        if (retryResult.data) {
          emailRecord = retryResult.data
          lookupError = null
        }
      }
      
      // Extract campaign_id and user_id from email record (more reliable than tags)
      if (emailRecord) {
        // Use campaign_id from database record (source of truth)
        if (emailRecord.campaign_id && !campaignId) {
          campaignId = emailRecord.campaign_id
          console.log('✅ Extracted campaign_id from email record:', campaignId)
        }
        // Use recipient_id as userId from database record
        if (emailRecord.recipient_id && !userId) {
          userId = emailRecord.recipient_id
          console.log('✅ Extracted user_id (recipient_id) from email record:', userId)
        }
      }

      // Strategy 3: Fallback - lookup by campaign_id and recipient (if tags available)
      if ((lookupError || !emailRecord) && campaignId && recipient) {
        console.log('Trying fallback lookup by campaign and recipient...')
        const { data: altRecord } = await supabase
          .from('emails')
          .select('id, resend_email_id, campaign_id')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .limit(10) // Get recent emails for this campaign
        
        // Find matching recipient
        if (altRecord && altRecord.length > 0) {
          // Try to match by recipient email via recipients table
          for (const record of altRecord) {
            const { data: emailWithRecipient } = await supabase
              .from('emails')
              .select(`
                id,
                resend_email_id,
                recipient:recipients(email)
              `)
              .eq('id', record.id)
              .single()
            
            if (emailWithRecipient?.recipient?.email === recipient) {
              console.log('Found email by campaign and recipient match:', emailWithRecipient)
              emailRecord = { id: emailWithRecipient.id, resend_email_id: emailWithRecipient.resend_email_id } as any
              break
            }
          }
        }
      }

      if (emailRecord) {
        emailRecordId = emailRecord.id
        // Ensure we have campaign_id and user_id from the email record
        if (emailRecord.campaign_id && !campaignId) {
          campaignId = emailRecord.campaign_id
        }
        if (emailRecord.recipient_id && !userId) {
          userId = emailRecord.recipient_id
        }
        console.log('✅ Found email record:', { 
          id: emailRecord.id, 
          resend_email_id: emailRecord.resend_email_id,
          campaign_id: emailRecord.campaign_id,
          recipient_id: emailRecord.recipient_id,
          extracted_campaign_id: campaignId,
          extracted_user_id: userId,
        })
      } else {
        console.warn(`⚠️ No email record found for resend_email_id: ${emailId}`)
        console.warn('This might happen if webhook arrives before email is saved to database')
        console.warn('Will use tags if available, otherwise event will be saved without linking')
        // Still save the event even if email record not found (will link later)
      }
    } else {
      console.warn('⚠️ No email_id in webhook event')
    }

    // Check for duplicate events before inserting
    // Resend may send duplicate webhooks, so we check if this event already exists
    const eventTimestamp = event.created_at || event.createdAt || new Date().toISOString()
    const resendEventId = event.id || event.data?.id || null
    
    // Check for duplicate events using multiple strategies BEFORE processing
    // This prevents duplicate inserts and status updates for ALL event types
    // 1. By email_id + event_type + timestamp (if emailRecordId found)
    // 2. By resend_email_id + event_type + timestamp (if emailRecordId not found but emailId exists)
    // 3. By campaign_id + recipient + event_type + timestamp (fallback)
    
    let existingEvent = null
    let detectionMethod = 'none'
    
    if (emailRecordId) {
      // Strategy 1: Check by email_id (most reliable)
      const { data: eventByEmailId } = await supabase
        .from('email_events')
        .select('id, email_id')
        .eq('email_id', emailRecordId)
        .eq('event_type', mappedEventType)
        .gte('created_at', new Date(new Date(eventTimestamp).getTime() - 10000).toISOString()) // Within 10 seconds
        .lte('created_at', new Date(new Date(eventTimestamp).getTime() + 10000).toISOString())
        .limit(1)
      
      if (eventByEmailId && eventByEmailId.length > 0) {
        existingEvent = eventByEmailId[0]
        detectionMethod = 'by_email_id'
      }
    }
    
    // Strategy 2: If not found and we have emailId, check by resend_email_id in raw field
    if (!existingEvent && emailId) {
      const { data: eventsByResendId } = await supabase
        .from('email_events')
        .select('id, raw')
        .eq('event_type', mappedEventType)
        .gte('created_at', new Date(new Date(eventTimestamp).getTime() - 10000).toISOString())
        .lte('created_at', new Date(new Date(eventTimestamp).getTime() + 10000).toISOString())
        .limit(100) // Get recent events to check raw field
      
      if (eventsByResendId) {
        // Check if any event has the same resend_email_id in raw field
        const duplicate = eventsByResendId.find((e: any) => 
          e.raw?.resend_email_id === emailId || 
          e.raw?.email_id === emailId ||
          e.raw?.data?.email_id === emailId ||
          (typeof e.raw === 'string' && JSON.parse(e.raw)?.data?.email_id === emailId)
        )
        if (duplicate) {
          existingEvent = duplicate
          detectionMethod = 'by_resend_id'
        }
      }
    }
    
    // Strategy 3: If we have campaignId and recipient, check by those
    if (!existingEvent && campaignId && recipient) {
      const { data: eventsByCampaign } = await supabase
        .from('email_events')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('recipient', recipient)
        .eq('event_type', mappedEventType)
        .gte('created_at', new Date(new Date(eventTimestamp).getTime() - 10000).toISOString())
        .lte('created_at', new Date(new Date(eventTimestamp).getTime() + 10000).toISOString())
        .limit(1)
      
      if (eventsByCampaign && eventsByCampaign.length > 0) {
        existingEvent = eventsByCampaign[0]
        detectionMethod = 'by_campaign_recipient'
      }
    }
    
    // If duplicate found, skip ALL processing (insert AND status update)
    if (existingEvent) {
      console.log('⚠️ Duplicate event detected, skipping ALL processing:', {
        emailRecordId: emailRecordId || 'null',
        emailId: emailId || 'null',
        eventType: mappedEventType,
        timestamp: eventTimestamp,
        existingEventId: existingEvent.id,
        detectionMethod,
      })
      return NextResponse.json({
        success: true,
        eventId: existingEvent.id,
        message: 'Event already processed (duplicate)',
        duplicate: true,
      })
    }

    // Insert event into email_events table
    // Always save events, even if email record not found (can link later)
    const insertData: any = {
      email_id: emailRecordId, // UUID from our emails table (if found, null otherwise)
      event_type: mappedEventType,
      raw: {
        ...event,
        resend_event_id: resendEventId, // Store Resend event ID for deduplication
      }, // Store full webhook payload with email_id for later linking
      created_at: eventTimestamp,
    }

    // Add optional fields if they exist in the schema
    if (userId) insertData.user_id = userId
    if (campaignId) insertData.campaign_id = campaignId
    if (recipient) insertData.recipient = recipient
    
    // Store Resend email_id in raw for later linking if email record not found
    if (!emailRecordId && emailId) {
      insertData.raw = {
        ...insertData.raw,
        resend_email_id: emailId, // Store for later linking
        needs_linking: true,
      }
    }

    console.log('📝 Inserting email event with final values:', {
      eventType: mappedEventType,
      emailRecordId,
      recipient,
      userId: userId || 'null (will try to link later)',
      campaignId: campaignId || 'null (will try to link later)',
      source: emailRecordId ? 'from_email_record' : (campaignId || userId ? 'from_tags' : 'none'),
    })
    
    // For click events, log additional details
    if (mappedEventType === 'clicked') {
      const clickLink = event.data?.link || event.data?.url || event.data?.clicked_link || 'Unknown'
      console.log('🖱️ Processing click event:', {
        link: clickLink,
        emailId: emailId,
        emailRecordId: emailRecordId,
        recipient: recipient,
      })
      
      // Store click link in raw data if available
      if (clickLink && clickLink !== 'Unknown') {
        insertData.raw = {
          ...insertData.raw,
          clicked_link: clickLink,
        }
      }
    }

    const { data: eventRecord, error: insertError } = await supabase
      .from('email_events')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting email event:', {
        error: insertError,
        insertData,
      })
      return NextResponse.json(
        { error: 'Failed to save event', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('Email event saved successfully:', { eventId: eventRecord.id })

    // Update email status in emails table based on event type
    if (emailRecordId) {
      // Use the event timestamp from webhook, not current time, for accurate tracking
      const eventTimestamp = event.created_at || event.createdAt || new Date().toISOString()
      
      const statusUpdates: Record<string, Partial<any>> = {
        sent: { status: 'sent', sent_at: eventTimestamp },
        delivered: { status: 'delivered', delivered_at: eventTimestamp },
        opened: { opened_at: eventTimestamp },
        clicked: { 
          status: 'clicked', // Update status to 'clicked' so it shows in campaign results
          clicked_at: eventTimestamp,
        },
        bounced: { status: 'bounced' },
        complained: { status: 'bounced' }, // Treat complaints as bounced
        unsubscribed: { status: 'bounced' }, // Track unsubscribes
      }

      const update = statusUpdates[mappedEventType]
      if (update) {
        // Check current status to avoid duplicate updates
        // Select all timestamp fields to check if they're already set
        const { data: currentEmail } = await supabase
          .from('emails')
          .select('status, sent_at, delivered_at, opened_at, clicked_at')
          .eq('id', emailRecordId)
          .single()
        
        if (currentEmail) {
          // Check if status update is needed (avoid duplicate updates for all event types)
          let shouldUpdate = true
          let skipReason = ''
          
          if (mappedEventType === 'clicked') {
            // Only skip if both status is 'clicked' AND clicked_at is already set
            // This ensures clicked_at gets set even if status was already 'clicked' but timestamp was missing
            if (currentEmail.status === 'clicked' && currentEmail.clicked_at) {
              shouldUpdate = false
              skipReason = 'already marked as clicked with timestamp'
            }
          } else if (mappedEventType === 'delivered') {
            // Only update if not already delivered with timestamp
            if (currentEmail.status === 'delivered' && currentEmail.delivered_at) {
              shouldUpdate = false
              skipReason = 'already marked as delivered with timestamp'
            }
          } else if (mappedEventType === 'opened') {
            // Only update if opened_at is not already set
            // Opened can happen multiple times, but we only track the first one
            if (currentEmail.opened_at) {
              shouldUpdate = false
              skipReason = 'opened_at already set'
            }
          } else if (mappedEventType === 'sent') {
            // Only update if not already sent
            if (currentEmail.status === 'sent' && currentEmail.sent_at) {
              shouldUpdate = false
              skipReason = 'already marked as sent'
            }
          } else if (mappedEventType === 'bounced') {
            // Only update if not already bounced
            if (currentEmail.status === 'bounced') {
              shouldUpdate = false
              skipReason = 'already marked as bounced'
            }
          }
          
          if (!shouldUpdate) {
            console.log(`⚠️ Email status already updated for ${mappedEventType}, skipping duplicate update: ${skipReason}`)
          } else {
            console.log(`Updating email status to: ${mappedEventType}`, {
              emailId: emailRecordId,
              update,
              eventTimestamp,
            })
            const { error: updateError } = await supabase
              .from('emails')
              .update(update)
              .eq('id', emailRecordId)
            
            if (updateError) {
              console.error(`❌ Error updating email status for ${mappedEventType}:`, updateError)
            } else {
              console.log(`✅ Email status updated successfully for ${mappedEventType}`, {
                emailId: emailRecordId,
                newStatus: update.status || 'unchanged',
                clicked_at: update.clicked_at || 'not set',
                opened_at: update.opened_at || 'not set',
              })
            }
          }
        } else {
          console.log(`Updating email status to: ${mappedEventType}`, update)
          const { error: updateError } = await supabase
            .from('emails')
            .update(update)
            .eq('id', emailRecordId)
          
          if (updateError) {
            console.error('Error updating email status:', updateError)
          } else {
            console.log('✅ Email status updated successfully')
          }
        }
      } else {
        console.log(`No status update for event type: ${mappedEventType}`)
      }
    } else if (emailId) {
      // Try to link event to email record by resend_email_id (in case email was saved after webhook)
      // Use retry logic since webhook might arrive before email record is saved
      console.log(`Attempting to link event to email with resend_email_id: ${emailId}`)
      
      let emailRecord: any = null
      const maxRetries = 3
      const retryDelays = [500, 1000, 2000] // Progressive delays: 500ms, 1s, 2s
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { data: foundRecord, error: lookupError } = await supabase
          .from('emails')
          .select('id, campaign_id, recipient_id, status, sent_at, delivered_at, opened_at, clicked_at')
          .eq('resend_email_id', emailId)
          .single()
        
        if (foundRecord && !lookupError) {
          emailRecord = foundRecord
          console.log(`✅ Found email record on attempt ${attempt + 1}:`, { 
            id: emailRecord.id,
            resend_email_id: emailId 
          })
          break
        } else {
          if (attempt < maxRetries - 1) {
            console.log(`Email record not found on attempt ${attempt + 1}, retrying in ${retryDelays[attempt]}ms...`)
            await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]))
          } else {
            console.warn(`⚠️ Email record not found after ${maxRetries} attempts for resend_email_id: ${emailId}`)
          }
        }
      }
      
      if (emailRecord && eventRecord) {
        // Update the event with the found email_id
        await supabase
          .from('email_events')
          .update({ email_id: emailRecord.id })
          .eq('id', eventRecord.id)
        
        console.log(`✅ Linked event to email record: ${emailRecord.id}`)
        
        // Check if status was already updated (avoid duplicate updates)
        // Only update if the current status is not already the target status
        // Use event timestamp from webhook for accurate tracking
        const eventTimestamp = event.created_at || event.createdAt || new Date().toISOString()
        
        // Use emailRecord data we already fetched (includes status and timestamps)
        if (emailRecord) {
          // Only update if status needs to change
          // Use event timestamp from webhook for accurate tracking
          const statusUpdates: Record<string, Partial<any>> = {
            sent: { status: 'sent', sent_at: eventTimestamp },
            delivered: { status: 'delivered', delivered_at: eventTimestamp },
            opened: { opened_at: eventTimestamp },
            clicked: { 
              status: 'clicked', // Update status to 'clicked' so it shows in campaign results
              clicked_at: eventTimestamp,
            },
            bounced: { status: 'bounced' },
          }
          
          const update = statusUpdates[mappedEventType]
          if (update) {
            // Check if update is needed (avoid duplicates for all event types)
            let shouldUpdate = true
            let skipReason = ''
            
            if (mappedEventType === 'clicked') {
              // Only skip if both status is 'clicked' AND clicked_at is already set
              // This ensures clicked_at gets set even if status was already 'clicked' but timestamp was missing
              if (emailRecord.status === 'clicked' && emailRecord.clicked_at) {
                shouldUpdate = false
                skipReason = 'already marked as clicked with timestamp'
              }
            } else if (mappedEventType === 'delivered') {
              if (emailRecord.status === 'delivered' && emailRecord.delivered_at) {
                shouldUpdate = false
                skipReason = 'already marked as delivered'
              }
            } else if (mappedEventType === 'opened') {
              // Only update if opened_at is not already set
              if (emailRecord.opened_at) {
                shouldUpdate = false
                skipReason = 'opened_at already set'
              }
            } else if (mappedEventType === 'sent') {
              if (emailRecord.status === 'sent' && emailRecord.sent_at) {
                shouldUpdate = false
                skipReason = 'already marked as sent'
              }
            } else if (mappedEventType === 'bounced') {
              if (emailRecord.status === 'bounced') {
                shouldUpdate = false
                skipReason = 'already marked as bounced'
              }
            }
            
            if (!shouldUpdate) {
              console.log(`⚠️ Email status already updated for ${mappedEventType} (fallback), skipping: ${skipReason}`)
            } else {
              const { error: updateError } = await supabase
                .from('emails')
                .update(update)
                .eq('id', emailRecord.id)
              
              if (updateError) {
                console.error(`❌ Error updating email status via fallback lookup for ${mappedEventType}:`, updateError)
              } else {
                console.log(`✅ Email status updated via fallback lookup: ${mappedEventType}`, {
                  emailId: emailRecord.id,
                  update,
                  eventTimestamp,
                })
              }
            }
          }
        }
      } else {
        console.warn(`⚠️ Cannot update email status: email record not found for resend_email_id: ${emailId} after ${maxRetries} retry attempts`)
        console.warn('Event saved but not linked to email. This may happen if:')
        console.warn('  1. Email record was never created in the database')
        console.warn('  2. resend_email_id mismatch between webhook and database')
        console.warn('  3. Webhook arrived significantly before email record was saved')
        console.warn('The event will remain unlinked. Consider implementing a background job to link orphaned events.')
      }
    } else {
      console.warn('⚠️ Cannot update email status: emailRecordId and emailId are both null')
    }

    // Log summary for click events to help debug timeline issues
    if (mappedEventType === 'clicked') {
      console.log('🖱️ CLICK EVENT PROCESSING SUMMARY:', {
        eventId: eventRecord.id,
        emailRecordId: emailRecordId || 'not found',
        emailId: emailId || 'not provided',
        emailRecordFound: !!emailRecordId,
        eventLinked: !!emailRecordId,
        statusUpdated: emailRecordId ? 'yes (if not duplicate)' : 'no (email record not found)',
        clicked_at: emailRecordId ? 'should be set in emails table' : 'not set (email record not found)',
      })
    }

    return NextResponse.json({
      success: true,
      eventId: eventRecord.id,
      message: 'Event processed successfully',
    })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Verify Resend webhook signature
 * Reference: https://resend.com/docs/webhooks/introduction#verifying-webhooks
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Resend uses HMAC SHA256 for signature verification
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(body)
    const expectedSignature = hmac.digest('hex')
    
    // Signature format: "sha256=<hash>"
    const providedHash = signature.replace('sha256=', '')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedHash)
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// Handle GET requests (for webhook verification/testing)
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  
  // Get recent email events for debugging
  const { data: recentEvents } = await supabase
    .from('email_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    message: 'Resend webhook endpoint is active',
    method: 'POST',
    webhookUrl: '/api/resend/webhook',
    events: ['email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained'],
    recentEvents: recentEvents || [],
    instructions: {
      setup: '1. Go to Resend Dashboard → Webhooks\n2. Create new webhook\n3. Set URL to: https://yourdomain.com/api/resend/webhook\n4. Select all email events\n5. Copy webhook secret to RESEND_WEBHOOK_SECRET env var',
    },
  })
}

