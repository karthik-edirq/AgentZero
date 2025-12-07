import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organization = searchParams.get('organization')
    const businessFunction = searchParams.get('businessFunction')

    let supabase
    try {
      supabase = createServerClient()
    } catch (clientError: any) {
      console.error('Failed to create Supabase client:', clientError)
      return NextResponse.json(
        { data: null, error: 'Database connection failed. Please check your Supabase configuration.' },
        { status: 500 }
      )
    }

    let query = supabase
      .from('recipients')
      .select(`
        *,
        organization:organizations(*)
      `)

    if (organization) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', organization)
        .single()

      if (orgError && orgError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is fine, we just don't filter
        console.error('Error fetching organization:', orgError)
      }

      if (org) {
        query = query.eq('organization_id', org.id)
      }
    }

    if (businessFunction && businessFunction !== 'all') {
      query = query.eq('business_function', businessFunction)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching recipients:', error)
      throw error
    }

    return NextResponse.json({ data: data || [], error: null })
  } catch (error: any) {
    console.error('Error in GET /api/recipients:', error)
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch recipients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

    // Get or create organization
    let { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', body.organization)
      .single()

    if (!org) {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: body.organization })
        .select('id')
        .single()

      if (orgError) throw orgError
      org = newOrg
    }

    // Insert recipients
    const recipients = body.emails.map((email: any) => ({
      email: email.email,
      name: email.name || null,
      role: email.role || null,
      organization_id: org.id,
      business_function: email.businessFunction || null,
    }))

    const { data, error } = await supabase
      .from('recipients')
      .upsert(recipients, {
        onConflict: 'email,organization_id',
        ignoreDuplicates: false,
      })
      .select()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

