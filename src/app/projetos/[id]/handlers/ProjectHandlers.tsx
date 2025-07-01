// src/app/projetos/[id]/handlers/ProjectHandlers.ts
import { supabase } from '@/lib/supabase'
import { 
  Milestone, 
  Activity, 
  MilestoneFormData, 
  ActivityFormData,
  MILESTONE_STATUSES,
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES
} from '../types/project.types'

// === MILESTONE HANDLERS ===
export class MilestoneHandlers {
  
  static async create(
    projectId: string, 
    formData: MilestoneFormData
  ): Promise<{ data: Milestone | null; error: string | null }> {
    try {
      const { title, description, responsible_id, deadline, status } = formData

      // Validações básicas
      if (!title?.trim()) {
        return { data: null, error: 'Título é obrigatório' }
      }

      if (!this.validateStatus(status)) {
        return { data: null, error: 'Status inválido para marco' }
      }

      console.log('Creating milestone with status:', status)

      const { data, error } = await supabase
        .from('project_milestones')
        .insert([{
          project_id: projectId,
          title: title.trim(),
          description: description?.trim() || null,
          due_date: deadline || null,
          assigned_to: responsible_id || null,
          status: status,
          progress_percentage: status === 'completed' ? 100 : 0
        }])
        .select(`
          *,
          responsible:team_members(id, full_name)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao criar marco:', error)
        return { data: null, error: this.getErrorMessage(error) }
      }

      console.log('✅ Marco criado com sucesso:', data)
      return { data, error: null }

    } catch (err) {
      console.error('💥 Erro inesperado ao criar marco:', err)
      return { data: null, error: 'Erro inesperado ao criar marco' }
    }
  }

  static async update(
    milestoneId: string, 
    formData: Partial<MilestoneFormData & { progress: number }>
  ): Promise<{ data: Milestone | null; error: string | null }> {
    try {
      const { title, description, deadline, status, responsible_id, progress } = formData

      // Validar status se fornecido
      if (status && !this.validateStatus(status)) {
        return { data: null, error: 'Status inválido para marco' }
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (deadline !== undefined) updateData.due_date = deadline
      if (status !== undefined) {
        updateData.status = status
        // Se marcado como concluído, progresso = 100%
        if (status === 'completed') {
          updateData.progress_percentage = 100
        }
      }
      if (responsible_id !== undefined) updateData.assigned_to = responsible_id
      if (progress !== undefined) updateData.progress_percentage = progress

      console.log('Updating milestone:', milestoneId, updateData)

      const { data, error } = await supabase
        .from('project_milestones')
        .update(updateData)
        .eq('id', milestoneId)
        .select(`
          *,
          responsible:team_members(id, full_name)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar marco:', error)
        return { data: null, error: this.getErrorMessage(error) }
      }

      return { data, error: null }

    } catch (err) {
      console.error('💥 Erro ao atualizar marco:', err)
      return { data: null, error: 'Erro inesperado ao atualizar marco' }
    }
  }

  static async delete(milestoneId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', milestoneId)

      if (error) {
        console.error('❌ Erro ao deletar marco:', error)
        return { success: false, error: this.getErrorMessage(error) }
      }

      return { success: true, error: null }

    } catch (err) {
      console.error('💥 Erro ao deletar marco:', err)
      return { success: false, error: 'Erro inesperado ao excluir marco' }
    }
  }

  static validateStatus(status: string): boolean {
    return MILESTONE_STATUSES.some(s => s.value === status)
  }

  static getStatusOptions() {
    return MILESTONE_STATUSES
  }

  static getStatusBadgeColor(status: string) {
    const statusConfig = MILESTONE_STATUSES.find(s => s.value === status.toLowerCase())
    return statusConfig?.color || 'bg-gray-100 text-gray-800'
  }

  private static getErrorMessage(error: any): string {
    if (error.code === '23514') {
      return 'Status inválido. Use: pending, in_progress, completed, delayed, cancelled'
    } else if (error.code === '42501') {
      return 'Erro de permissão - RLS pode estar ativo'
    } else {
      return error.message || 'Erro desconhecido'
    }
  }
}

// === ACTIVITY HANDLERS ===
export class ActivityHandlers {
  
  static async create(
    projectId: string, 
    formData: ActivityFormData
  ): Promise<{ data: Activity | null; error: string | null }> {
    try {
      const { title, description, category, responsible_id, deadline, status } = formData

      // Validações básicas
      if (!title?.trim()) {
        return { data: null, error: 'Título é obrigatório' }
      }

      if (!category) {
        return { data: null, error: 'Categoria é obrigatória' }
      }

      if (!this.validateStatus(status)) {
        return { data: null, error: 'Status inválido para atividade' }
      }

      if (!this.validateType(category)) {
        return { data: null, error: 'Categoria inválida' }
      }

      console.log('Creating deliverable with status:', status)

      const { data, error } = await supabase
        .from('project_deliverables')
        .insert([{
          project_id: projectId,
          title: title.trim(),
          description: description?.trim() || null,
          type: category,
          due_date: deadline || null,
          assigned_to: responsible_id || null,
          status: status
        }])
        .select(`
          *,
          responsible:team_members(id, full_name)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao criar atividade:', error)
        return { data: null, error: this.getErrorMessage(error) }
      }

      console.log('✅ Atividade criada com sucesso:', data)
      return { data, error: null }

    } catch (err) {
      console.error('💥 Erro inesperado ao criar atividade:', err)
      return { data: null, error: 'Erro inesperado ao criar atividade' }
    }
  }

  static async update(
    activityId: string, 
    formData: Partial<ActivityFormData>
  ): Promise<{ data: Activity | null; error: string | null }> {
    try {
      const { title, description, category, responsible_id, deadline, status } = formData

      // Validações
      if (status && !this.validateStatus(status)) {
        return { data: null, error: 'Status inválido para atividade' }
      }

      if (category && !this.validateType(category)) {
        return { data: null, error: 'Categoria inválida' }
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (category !== undefined) updateData.type = category
      if (responsible_id !== undefined) updateData.assigned_to = responsible_id
      if (deadline !== undefined) updateData.due_date = deadline
      if (status !== undefined) updateData.status = status

      console.log('Updating deliverable:', activityId, updateData)

      const { data, error } = await supabase
        .from('project_deliverables')
        .update(updateData)
        .eq('id', activityId)
        .select(`
          *,
          responsible:team_members(id, full_name)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar atividade:', error)
        return { data: null, error: this.getErrorMessage(error) }
      }

      return { data, error: null }

    } catch (err) {
      console.error('💥 Erro ao atualizar atividade:', err)
      return { data: null, error: 'Erro inesperado ao atualizar atividade' }
    }
  }

  static async delete(activityId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('project_deliverables')
        .delete()
        .eq('id', activityId)

      if (error) {
        console.error('❌ Erro ao deletar atividade:', error)
        return { success: false, error: this.getErrorMessage(error) }
      }

      return { success: true, error: null }

    } catch (err) {
      console.error('💥 Erro ao deletar atividade:', err)
      return { success: false, error: 'Erro inesperado ao excluir atividade' }
    }
  }

  static validateStatus(status: string): boolean {
    return ACTIVITY_STATUSES.some(s => s.value === status)
  }

  static validateType(type: string): boolean {
    return ACTIVITY_TYPES.some(t => t.value === type)
  }

  static getStatusOptions() {
    return ACTIVITY_STATUSES
  }

  static getTypeOptions() {
    return ACTIVITY_TYPES
  }

  static getStatusBadgeColor(status: string) {
    const statusConfig = ACTIVITY_STATUSES.find(s => s.value === status.toLowerCase())
    return statusConfig?.color || 'bg-gray-100 text-gray-800'
  }

  private static getErrorMessage(error: any): string {
    if (error.code === '23514') {
      if (error.message.includes('type')) {
        return 'Tipo inválido. Use: documentation, code, interface, testing, infrastructure, analysis'
      } else if (error.message.includes('status')) {
        return 'Status inválido. Use: draft, in_progress, review, approved, delivered, cancelled'
      }
    } else if (error.code === '42501') {
      return 'Erro de permissão - RLS pode estar ativo'
    }
    return error.message || 'Erro desconhecido'
  }
}

// === UTILITY FUNCTIONS ===
export class ProjectUtils {
  
  static translateStatus(status: string, type: 'milestone' | 'activity' = 'milestone'): string {
    if (type === 'milestone') {
      const milestoneStatus = MILESTONE_STATUSES.find(s => s.value === status.toLowerCase())
      return milestoneStatus?.label || status
    } else {
      const activityStatus = ACTIVITY_STATUSES.find(s => s.value === status.toLowerCase())
      return activityStatus?.label || status
    }
  }

  static translateType(type: string): string {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type.toLowerCase())
    return activityType?.label || type
  }

  static getTypeIcon(type: string): string {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type.toLowerCase())
    return activityType?.icon || '📄'
  }

  static isOverdue(dueDate: string | undefined, status: string): boolean {
    if (!dueDate) return false
    
    const completedStatuses = ['completed', 'approved', 'delivered']
    if (completedStatuses.includes(status.toLowerCase())) return false
    
    return new Date(dueDate) < new Date()
  }

  static getDaysUntilDue(dueDate: string | undefined): number | null {
    if (!dueDate) return null
    
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  static formatDateRange(startDate?: string, endDate?: string): string {
    if (!startDate && !endDate) return 'Datas não definidas'
    if (!startDate) return `Até ${this.formatDate(endDate)}`
    if (!endDate) return `Desde ${this.formatDate(startDate)}`
    
    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`
  }

  private static formatDate(dateString?: string): string {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }
}

// === COMBINED HANDLERS OBJECT (for backward compatibility) ===
export const ProjectHandlers = {
  // Milestone methods
  handleNewMilestone: async (projectId: string, formData: MilestoneFormData) => {
    return await MilestoneHandlers.create(projectId, formData)
  },
  
  handleUpdateMilestone: async (milestoneId: string, updates: Partial<MilestoneFormData & { progress: number }>) => {
    return await MilestoneHandlers.update(milestoneId, updates)
  },
  
  handleDeleteMilestone: async (milestoneId: string) => {
    return await MilestoneHandlers.delete(milestoneId)
  },

  // Activity methods
  handleNewActivity: async (projectId: string, formData: ActivityFormData) => {
    return await ActivityHandlers.create(projectId, formData)
  },
  
  handleUpdateActivity: async (activityId: string, updates: Partial<ActivityFormData>) => {
    return await ActivityHandlers.update(activityId, updates)
  },
  
  handleDeleteActivity: async (activityId: string) => {
    return await ActivityHandlers.delete(activityId)
  },

  // Helper methods
  getMilestoneStatusOptions: () => MilestoneHandlers.getStatusOptions(),
  getActivityStatusOptions: () => ActivityHandlers.getStatusOptions(),
  getActivityTypeOptions: () => ActivityHandlers.getTypeOptions(),
  
  validateMilestoneStatus: (status: string) => MilestoneHandlers.validateStatus(status),
  validateActivityStatus: (status: string) => ActivityHandlers.validateStatus(status),
  validateActivityType: (type: string) => ActivityHandlers.validateType(type),

  // Badge helpers
  getMilestoneStatusBadge: (status: string) => ({
    label: ProjectUtils.translateStatus(status, 'milestone'),
    color: MilestoneHandlers.getStatusBadgeColor(status)
  }),
  
  getActivityStatusBadge: (status: string) => ({
    label: ProjectUtils.translateStatus(status, 'activity'),
    color: ActivityHandlers.getStatusBadgeColor(status)
  })
}