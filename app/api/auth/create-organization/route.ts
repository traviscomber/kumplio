import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { organizationName, userId } = await request.json()

    if (!organizationName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: organizationName,
        country: 'CL',
      }])
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      return NextResponse.json(
        { error: 'Error al crear la organización' },
        { status: 500 }
      )
    }

    // Add user as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: orgData.id,
        user_id: userId,
        role: 'owner',
      }])

    if (memberError) {
      console.error('Member creation error:', memberError)
      // Try to delete the organization we just created
      await supabase.from('organizations').delete().eq('id', orgData.id)
      return NextResponse.json(
        { error: 'Error al configurar la membresía' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organizationId: orgData.id,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
