// src/types/sales.ts

export type SalesStage = 
  | 'Lead Gerado'
  | 'Qualificado'
  | 'Diagnóstico Realizado'
  | 'Proposta Enviada' 
  | 'Negociação'
  | 'Proposta Aceita'
  | 'Contrato Assinado'
  | 'Perdido'

export type ActivityType = 
  | 'Ligação'
  | 'Email'
  | 'Reunião'
  | 'Proposta'
  | 'Seguimento'
  | 'Nota'
  | 'Mudança de Stage'

export interface SalesOpportunity {
  id: string
  company_name: string
  company_cnpj: string | null
  contact_name: string
  contact_email: string
  contact_phone: string | null
  opportunity_title: string
  description: string | null
  estimated_value: number
  probability_percentage: number
  stage: SalesStage
  expected_close_date: string | null
  actual_close_date: string | null
  lead_source: string | null
  assigned_to: string | null
  display_order: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relacionamentos
  team_member?: {
    id: string
    full_name: string
    email: string
  }
  activities?: SalesActivity[]
}

export interface SalesActivity {
  id: string
  opportunity_id: string
  activity_type: ActivityType
  title: string
  description: string | null
  created_by: string | null
  activity_date: string
  created_at: string
  
  // Relacionamentos
  creator?: {
    id: string
    full_name: string
    email: string
  }
}

export interface SalesPipelineStats {
  total_opportunities: number
  total_value: number
  avg_deal_size: number
  conversion_rate: number
  by_stage: {
    stage: SalesStage
    count: number
    total_value: number
    avg_probability: number
  }[]
}

export interface NewOpportunityForm {
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  opportunity_title: string
  description: string
  estimated_value: number
  probability_percentage: number
  stage: SalesStage
  expected_close_date: string
  lead_source: string
  assigned_to: string
}

export interface NewActivityForm {
  activity_type: ActivityType
  title: string
  description: string
}