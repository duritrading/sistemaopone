export interface Project {
  id: string
  name: string
  description?: string
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
  health: 'healthy' | 'warning' | 'critical'
  progress?: number
  budget?: number
  start_date?: string
  end_date?: string
  client_id?: string
  project_manager_id?: string
  created_at: string
  updated_at: string
  
  // Relacionamentos
  client?: {
    id: string
    name: string
    company_name?: string
  }
  project_manager?: {
    id: string
    name: string
    email: string
  }
}

export interface ProjectTeamMember {
  id: string
  project_id: string
  team_member_id: string
  role: string
  created_at: string
  
  // Relacionamento
  team_member: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface ProjectScopeItem {
  id: string
  project_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  completed_at?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface ProjectTechnology {
  id: string
  project_id: string
  technology_name: string
  version?: string
  category: 'frontend' | 'backend' | 'database' | 'infrastructure' | 'tool' | 'other'
  created_at: string
}

export interface ProjectWithDetails extends Project {
  team_members?: ProjectTeamMember[]
  scope_items?: ProjectScopeItem[]
  technologies?: ProjectTechnology[]
}