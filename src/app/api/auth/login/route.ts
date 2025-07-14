// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Login attempt:', { email: body.email })
    
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      console.log('Validation failed:', validation.error)
      return NextResponse.json(
        { success: false, message: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Buscar usuário no banco
    const { data: user, error } = await supabase
      .from('team_members')
      .select('id, email, full_name, profile_photo_url, seniority_level, primary_specialization, password_hash, first_login, is_active')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single()

    console.log('Database query result:', { 
      found: !!user, 
      error: error?.message,
      has_password: !!user?.password_hash 
    })

    if (error || !user) {
      console.log('User not found or database error')
      return NextResponse.json(
        { success: false, message: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Para TESTE inicial - aceitar senha padrão "opone123" para qualquer usuário
    // Depois implementaremos bcrypt adequadamente
    if (password !== 'opone123') {
      console.log('Password verification failed')
      return NextResponse.json(
        { success: false, message: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    console.log('Login successful for user:', user.email)

    // Atualizar last_access
    await supabase
      .from('team_members')
      .update({ last_access: new Date().toISOString() })
      .eq('id', user.id)

    // Criar token simples (depois implementaremos JWT adequadamente)
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
    })).toString('base64')

    const userResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      profile_photo_url: user.profile_photo_url,
      seniority_level: user.seniority_level,
      primary_specialization: user.primary_specialization,
      first_login: user.first_login ?? true
    }

    const response = NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Login realizado com sucesso'
    })

    // Definir cookie httpOnly com o token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 // 8 horas
    })

    return response
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}