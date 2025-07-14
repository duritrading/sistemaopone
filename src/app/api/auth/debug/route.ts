// src/app/api/auth/debug/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Verificar estrutura da tabela
    const { data: users, error } = await supabase
      .from('team_members')
      .select('id, email, full_name, password_hash, first_login, is_active')
      .eq('is_active', true)
      .limit(5)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Erro ao consultar team_members'
      })
    }

    const usersInfo = users?.map(user => ({
      email: user.email,
      full_name: user.full_name,
      has_password: !!user.password_hash,
      password_length: user.password_hash?.length || 0,
      first_login: user.first_login,
      is_active: user.is_active
    }))

    return NextResponse.json({
      success: true,
      message: 'Debug info',
      data: {
        total_users: users?.length || 0,
        users: usersInfo,
        database_connection: 'OK'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Erro interno do servidor'
    })
  }
}