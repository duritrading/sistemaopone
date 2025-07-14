// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token não encontrado' },
        { status: 401 }
      )
    }

    // Decodificar token simples
    let decoded
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    } catch {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      )
    }

    // Verificar expiração
    if (decoded.exp < Date.now()) {
      return NextResponse.json(
        { success: false, message: 'Token expirado' },
        { status: 401 }
      )
    }

    // Buscar usuário atualizado
    const { data: user, error } = await supabase
      .from('team_members')
      .select('id, email, full_name, profile_photo_url, seniority_level, primary_specialization, first_login')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        profile_photo_url: user.profile_photo_url,
        seniority_level: user.seniority_level,
        primary_specialization: user.primary_specialization,
        first_login: user.first_login ?? true
      }
    })
  } catch (error) {
    console.error('Current user API error:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}