import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

    // Send email via Resend
    const result = await sendEmail({
      to: body.to,
      subject: body.subject,
      html: body.html,
    })

    if (!result.success) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: 500 }
      )
    }

    // Save email record to database
    const { data: emailRecord, error: dbError } = await supabase
      .from('emails')
      .insert({
        campaign_id: body.campaignId,
        recipient_id: body.recipientId,
        subject: body.subject,
        body: body.html,
        status: 'sent',
        resend_email_id: result.data?.id || null,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving email to database:', dbError)
      // Don't fail the request if DB save fails
    }

    // Create email event
    if (emailRecord) {
      await supabase.from('email_events').insert({
        email_id: emailRecord.id,
        event_type: 'sent',
        metadata: { resend_id: result.data?.id },
      })
    }

    return NextResponse.json({
      data: {
        emailId: emailRecord?.id,
        resendId: result.data?.id,
        status: 'sent',
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

