// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para TypeScript
export type Database = {
  public: {
    Tables: {
      team_members: {
        Row: {
          id: string
          full_name: string
          email: string
          profile_photo_url: string | null
          seniority_level: 'Trainee' | 'Junior' | 'Pleno' | 'Sênior' | 'Principal'
          primary_specialization: 'Machine Learning/IA' | 'Ciência de Dados' | 'Backend' | 'Frontend' | 'DevOps' | 'Produto' | 'QA' | 'UX/UI'
          work_modality: 'Presencial' | 'Remoto' | 'Híbrido'
          availability_status: 'Disponível' | 'Parcial' | 'Ocupado' | 'Férias' | 'Afastamento médico'
          allocation_percentage: number
          last_access: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          profile_photo_url?: string | null
          seniority_level: 'Trainee' | 'Junior' | 'Pleno' | 'Sênior' | 'Principal'
          primary_specialization: 'Machine Learning/IA' | 'Ciência de Dados' | 'Backend' | 'Frontend' | 'DevOps' | 'Produto' | 'QA' | 'UX/UI'
          work_modality: 'Presencial' | 'Remoto' | 'Híbrido'
          availability_status?: 'Disponível' | 'Parcial' | 'Ocupado' | 'Férias' | 'Afastamento médico'
          allocation_percentage?: number
          last_access?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          profile_photo_url?: string | null
          seniority_level?: 'Trainee' | 'Junior' | 'Pleno' | 'Sênior' | 'Principal'
          primary_specialization?: 'Machine Learning/IA' | 'Ciência de Dados' | 'Backend' | 'Frontend' | 'DevOps' | 'Produto' | 'QA' | 'UX/UI'
          work_modality?: 'Presencial' | 'Remoto' | 'Híbrido'
          availability_status?: 'Disponível' | 'Parcial' | 'Ocupado' | 'Férias' | 'Afastamento médico'
          allocation_percentage?: number
          last_access?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}