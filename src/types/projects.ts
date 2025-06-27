// src/types/projects.ts

export type ProjectStatus = 
  | 'Rascunho' 
  | 'Proposta' 
  | 'Aprovado' 
  | 'Executando' 
  | 'Pausado' 
  | 'Concluído' 
  | 'Cancelado'

export type ProjectType = 
  | 'MVP' 
  | 'PoC' 
  | 'Implementação' 
  | 'Consultoria' 
  | 'Suporte'

export type ProjectHealth = 
  | 'Excelente'    // 80-100%
  | 'Bom'          // 60-79%
  | 'Crítico'      // 0-59%

export type RiskLevel = 
  | 'Baixo'
  | 'Médio'
  | 'Alto'
  | 'Crítico'

export interface Project {
  id: string
  name: string
  description?: string
  project_type: ProjectType
  status: ProjectStatus
  health_score: number
  health_status: ProjectHealth
  
  // Cliente
  client_id: string
  client?: {
    id: string
    company_name: string
    logo_url?: string
  }
  
  // Responsável
  manager_id?: string
  manager?: {
    id: string
    full_name: string
    avatar_url?: string
    email: string
  }
  
  // Datas
  start_date?: string
  estimated_end_date?: string
  actual_end_date?: string
  created_at: string
  updated_at: string
  
  // Orçamento
  total_budget: number
  used_budget: number
  remaining_budget: number
  budget_percentage: number
  
  // Progresso
  progress_percentage: number
  completed_milestones: number
  total_milestones: number
  
  // Próximo marco
  next_milestone?: {
    id: string
    name: string
    due_date: string
    is_overdue: boolean
  }
  
  // Riscos e indicadores
  risk_level: RiskLevel
  days_remaining?: number
  is_overdue: boolean
  is_near_deadline: boolean
  
  // Configurações
  is_active: boolean
  is_archived: boolean
  
  // Contadores
  comments_count: number
  attachments_count: number
  team_members_count: number
}

export interface ProjectMilestone {
  id: string
  project_id: string
  name: string
  description?: string
  due_date: string
  completed_date?: string
  is_completed: boolean
  is_overdue: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface ProjectComment {
  id: string
  project_id: string
  user_id: string
  user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  content: string
  is_internal: boolean
  created_at: string
  updated_at: string
}

export interface ProjectAttachment {
  id: string
  project_id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  uploaded_by: string
  uploader?: {
    id: string
    full_name: string
  }
  created_at: string
}

export interface ProjectTeamMember {
  id: string
  project_id: string
  user_id: string
  role: string
  allocation_percentage: number
  start_date: string
  end_date?: string
  is_active: boolean
  user?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

export interface CreateProjectRequest {
  name: string
  description?: string
  project_type: ProjectType
  client_id: string
  manager_id?: string
  start_date?: string
  estimated_end_date?: string
  total_budget: number
  initial_milestones?: string[]
}

export interface UpdateProjectRequest {
  id: string
  name?: string
  description?: string
  project_type?: ProjectType
  status?: ProjectStatus
  client_id?: string
  manager_id?: string
  start_date?: string
  estimated_end_date?: string
  total_budget?: number
}

export interface ProjectFilters {
  search: string
  status: ProjectStatus | 'all'
  manager_id: string | 'all' | 'unassigned'
  client_id: string | 'all'
  project_type: ProjectType | 'all'
  health: ProjectHealth | 'all'
  risk: RiskLevel | 'all'
  start_date_from?: string
  start_date_to?: string
  end_date_from?: string
  end_date_to?: string
  budget_min?: number
  budget_max?: number
  period_preset: 'all' | 'last_month' | 'current_quarter' | 'next_90_days'
}

export interface ProjectMetrics {
  total_projects: number
  active_projects: number
  completed_projects: number
  overdue_projects: number
  critical_projects: number
  
  projects_by_status: Record<ProjectStatus, number>
  projects_by_health: Record<ProjectHealth, number>
  projects_by_type: Record<ProjectType, number>
  projects_by_risk: Record<RiskLevel, number>
  
  total_budget: number
  used_budget: number
  remaining_budget: number
  average_health_score: number
  
  completion_rate: number
  on_time_delivery_rate: number
  budget_efficiency: number
  
  upcoming_deadlines: number
  overdue_milestones: number
  
  // Métricas específicas do OpOne
  total_value: number
  average_progress: number
}

export interface BulkProjectAction {
  project_ids: string[]
  action: 'change_status' | 'reassign_manager' | 'archive' | 'export'
  new_status?: ProjectStatus
  new_manager_id?: string
}