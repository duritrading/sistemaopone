// src/app/projetos/[id]/types/project.types.ts
export interface ProjectDetails {
  id: string
  name: string
  description?: string
  status: string
  health: string
  progress_percentage: number
  total_budget: number
  used_budget: number
  start_date?: string
  estimated_end_date?: string
  risk_level: string
  project_type: string
  next_milestone?: string
  client?: { 
    id: string
    company_name: string 
  }
  manager?: { 
    id: string
    full_name: string 
  }
}

export interface Milestone {
  id: string
  project_id: string
  title: string
  description?: string
  status: string
  due_date?: string
  deadline?: string // Compatibilidade
  assigned_to?: string
  responsible_id?: string // Compatibilidade
  progress_percentage: number
  created_at: string
  updated_at: string
  responsible?: { 
    id?: string
    full_name: string 
  }
}

export interface Activity {
  id: string
  project_id: string
  title: string
  description?: string
  status: string
  type?: string
  category?: string // Compatibilidade
  due_date?: string
  deadline?: string // Compatibilidade
  assigned_to?: string
  responsible_id?: string // Compatibilidade
  version?: string
  created_at: string
  updated_at: string
  responsible?: { 
    id?: string
    full_name: string 
  }
}

export interface TeamMember {
  id: string
  full_name: string
  email: string
  profile_photo_url?: string
  seniority_level?: string
  primary_specialization?: string
  work_modality?: string
  availability_status?: string
  allocation_percentage?: number
  is_active: boolean
}

export interface ProjectKPIs {
  totalMilestones: number
  completedMilestones: number
  totalActivities: number
  completedActivities: number
  overallProgress: number
  daysRemaining: number
  budgetUtilization: number
  activeRisks: number
}

export interface StatusOption {
  value: string
  label: string
  color?: string
}

export interface TypeOption {
  value: string
  label: string
  icon?: string
}

// Estados de UI
export interface ProjectPageState {
  activeTab: 'overview' | 'deliverables' | 'timeline' | 'communication'
  loading: boolean
  error: string | null
  mounted: boolean
}

export interface FilterState {
  typeFilter: string
  responsibleFilter: string
  statusFilter: string
  searchTerm: string
}

export interface ModalState {
  isNewMilestoneModalOpen: boolean
  isNewActivityModalOpen: boolean
  editingItem: (Milestone | Activity) & { type?: 'marco' | 'atividade' } | null
}

// Form Data Types
export interface MilestoneFormData {
  title: string
  description: string
  responsible_id: string
  deadline: string
  status: string
  progress?: number
}

export interface ActivityFormData {
  title: string
  description: string
  category: string
  responsible_id: string
  deadline: string
  status: string
}

// API Response Types
export interface ProjectResponse {
  data: ProjectDetails | null
  error: string | null
}

export interface MilestonesResponse {
  data: Milestone[]
  error: string | null
}

export interface ActivitiesResponse {
  data: Activity[]
  error: string | null
}

export interface TeamMembersResponse {
  data: TeamMember[]
  error: string | null
}

// Error Types
export interface ProjectError {
  code?: string
  message: string
  details?: any
}

// Constants
export const MILESTONE_STATUSES: StatusOption[] = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'delayed', label: 'Atrasado', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-gray-100 text-gray-600' }
]

export const ACTIVITY_STATUSES: StatusOption[] = [
  { value: 'draft', label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'Em Progresso', color: 'bg-blue-100 text-blue-800' },
  { value: 'review', label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  { value: 'delivered', label: 'Entregue', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
]

export const ACTIVITY_TYPES: TypeOption[] = [
  { value: 'documentation', label: 'Documento', icon: '📄' },
  { value: 'code', label: 'Código', icon: '💻' },
  { value: 'interface', label: 'Interface', icon: '🎨' },
  { value: 'testing', label: 'Teste', icon: '🧪' },
  { value: 'infrastructure', label: 'Infraestrutura', icon: '⚙️' },
  { value: 'analysis', label: 'Análise', icon: '📊' }
]

// Utility Types
export type TabId = ProjectPageState['activeTab']
export type ItemType = 'marco' | 'atividade'
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'