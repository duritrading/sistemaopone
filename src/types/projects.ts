export interface Project {
  id: string;
  name: string;
  description?: string;
  project_type: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  health: 'healthy' | 'warning' | 'critical';
  health_score: number; // Adicionado para lógica de saúde
  total_budget: number;
  used_budget: number; // Adicionado
  progress_percentage: number;
  start_date?: string;
  estimated_end_date?: string;
  risk_level: string; // Adicionado
  next_milestone?: string; // Adicionado
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  client?: {
    id: string;
    company_name: string;
  };
  manager?: {
    id: string;
    full_name: string;
  };
  // Para a contagem de equipe, faremos na query
  project_team_members?: { count: number }[]; 
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