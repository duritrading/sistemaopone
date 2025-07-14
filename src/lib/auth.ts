// src/lib/auth.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from './supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
const JWT_EXPIRES_IN = '8h'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  profile_photo_url: string | null
  seniority_level: string
  primary_specialization: string
  first_login: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string } | null> {
    try {
      const { data: user, error } = await supabase
        .from('team_members')
        .select('id, email, full_name, profile_photo_url, seniority_level, primary_specialization, password_hash, first_login')
        .eq('email', credentials.email.toLowerCase())
        .eq('is_active', true)
        .single()

      if (error || !user || !user.password_hash) {
        return null
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)
      if (!isValidPassword) {
        return null
      }

      // Atualizar last_access
      await supabase
        .from('team_members')
        .update({ last_access: new Date().toISOString() })
        .eq('id', user.id)

      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 horas
        },
        JWT_SECRET
      )

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        profile_photo_url: user.profile_photo_url,
        seniority_level: user.seniority_level,
        primary_specialization: user.primary_specialization,
        first_login: user.first_login
      }

      return { user: authUser, token }
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  }

  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      const { data: user, error } = await supabase
        .from('team_members')
        .select('id, email, full_name, profile_photo_url, seniority_level, primary_specialization, first_login')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single()

      if (error || !user) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        profile_photo_url: user.profile_photo_url,
        seniority_level: user.seniority_level,
        primary_specialization: user.primary_specialization,
        first_login: user.first_login
      }
    } catch (error) {
      return null
    }
  }

  static async changePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      
      const { error } = await supabase
        .from('team_members')
        .update({ 
          password_hash: hashedPassword,
          first_login: false
        })
        .eq('id', userId)

      return !error
    } catch (error) {
      console.error('Change password error:', error)
      return false
    }
  }
}