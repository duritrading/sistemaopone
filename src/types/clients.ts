// src/types/clients.ts

export type CompanySize = 'Startup' | 'Pequena' | 'Média' | 'Grande' | 'Enterprise'

export type RelationshipStatus = 'Prospect' | 'Ativo' | 'Inativo' | 'Renovação' | 'Churned'

export type AccountHealth = 'Excelente' | 'Saudável' | 'Em Risco' | 'Crítico'

export type ContactType = 'Primário' | 'Técnico' | 'Comercial' | 'Executivo' | 'Profissional'

export type InteractionType = 
  | 'Ligação' 
  | 'Email' 
  | 'Reunião' 
  | 'Apresentação' 
  | 'Workshop'
  | 'Check-in' 
  | 'Suporte' 
  | 'Renovação' 
  | 'Feedback' 
  | 'Nota'

export type InteractionOutcome = 'Positivo' | 'Neutro' | 'Negativo'

export interface Client {
  id: string
  
  // Dados da Empresa
  company_name: string
  company_cnpj: string | null
  company_size: CompanySize | null
  industry: string | null
  website: string | null
  
  // Endereço
  address_street: string | null
  address_city: string | null
  address_state: string | null
  address_zipcode: string | null
  address_country: string | null
  
  // Status do Relacionamento
  relationship_status: RelationshipStatus
  account_health: AccountHealth
  
  // Informações Comerciais
  total_contract_value: number
  monthly_recurring_revenue: number
  contract_start_date: string | null
  contract_end_date: string | null
  
  // Responsável
  account_manager_id: string | null
  
  // Observações
  notes: string | null
  
  // Controle
  is_active: boolean
  
  // Auditoria
  created_at: string
  updated_at: string
  
  // Relacionamentos
  account_manager?: {
    id: string
    full_name: string
    email: string
  }
  contacts?: ClientContact[]
  interactions?: ClientInteraction[]
}

export interface ClientContact {
  id: string
  client_id: string
  
  // Dados Pessoais
  full_name: string
  job_title: string | null
  department: string | null
  
  // Contato
  email: string | null
  phone: string | null
  mobile: string | null
  
  // Tipo de Contato
  contact_type: ContactType
  is_primary: boolean
  
  // Status
  is_active: boolean
  
  // Auditoria
  created_at: string
  updated_at: string
}

export interface ClientInteraction {
  id: string
  client_id: string
  contact_id: string | null
  
  // Tipo de Interação
  interaction_type: InteractionType
  
  // Detalhes
  title: string
  description: string | null
  outcome: InteractionOutcome | null
  
  // Responsável
  created_by: string | null
  
  // Data da Interação
  interaction_date: string
  created_at: string
  
  // Relacionamentos
  contact?: ClientContact
  creator?: {
    id: string
    full_name: string
    email: string
  }
}

export interface ClientMetrics {
  total_clients: number
  active_clients: number
  prospects: number
  churned_clients: number
  total_contract_value: number
  monthly_recurring_revenue: number
  average_contract_value: number
  clients_by_health: {
    excellent: number
    healthy: number
    at_risk: number
    critical: number
  }
  clients_by_size: {
    startup: number
    small: number
    medium: number
    large: number
    enterprise: number
  }
}

// Para formulários
export interface CreateClientRequest {
  company_name: string
  company_cnpj?: string
  company_size?: CompanySize
  industry?: string
  website?: string
  address_street?: string
  address_city?: string
  address_state?: string
  address_zipcode?: string
  address_country?: string
  relationship_status: RelationshipStatus
  account_health: AccountHealth
  total_contract_value?: number
  monthly_recurring_revenue?: number
  contract_start_date?: string
  contract_end_date?: string
  account_manager_id?: string
  notes?: string
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: string
}

export interface CreateContactRequest {
  client_id: string
  full_name: string
  job_title?: string
  department?: string
  email?: string
  phone?: string
  mobile?: string
  contact_type: ContactType
  is_primary?: boolean
}

export interface CreateInteractionRequest {
  client_id: string
  contact_id?: string
  interaction_type: InteractionType
  title: string
  description?: string
  outcome?: InteractionOutcome
  interaction_date?: string
}