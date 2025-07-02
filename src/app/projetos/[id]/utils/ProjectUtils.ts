// src/app/projetos/[id]/utils/ProjectUtils.ts
import { 
  MILESTONE_STATUSES, 
  ACTIVITY_STATUSES, 
  ACTIVITY_TYPES 
} from '../types/project.types'

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
    
    const completedStatuses = ['completed', 'approved', 'delivered', 'concluído', 'aprovado']
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

  static formatDate(dateString?: string): string {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  static getProgressColor(progress: number, isOverdue: boolean = false): string {
    if (isOverdue && progress < 100) return 'bg-red-600'
    if (progress >= 100) return 'bg-green-600'
    if (progress >= 75) return 'bg-blue-600'
    if (progress >= 50) return 'bg-yellow-600'
    return 'bg-gray-400'
  }

  static getStatusColor(status: string, type: 'milestone' | 'activity'): string {
    const normalizedStatus = status.toLowerCase()
    
    switch (normalizedStatus) {
      case 'completed':
      case 'concluído':
      case 'approved':
      case 'aprovado':
      case 'delivered':
        return 'bg-green-100 text-green-800'
      
      case 'in_progress':
      case 'em_andamento':
      case 'review':
      case 'revisão':
        return 'bg-blue-100 text-blue-800'
      
      case 'pending':
      case 'pendente':
      case 'draft':
      case 'rascunho':
        return 'bg-yellow-100 text-yellow-800'
      
      case 'cancelled':
      case 'cancelado':
      case 'blocked':
      case 'bloqueado':
        return 'bg-red-100 text-red-800'
      
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  static calculateCompletionPercentage(completed: number, total: number): number {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  static getHealthColor(health: string): string {
    switch (health.toLowerCase()) {
      case 'healthy':
      case 'bom':
      case 'good':
        return 'text-green-600'
      case 'warning':
      case 'atenção':
      case 'attention':
        return 'text-yellow-600'
      case 'critical':
      case 'crítico':
      case 'bad':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  static getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'alta':
        return 'bg-red-100 text-red-800'
      case 'medium':
      case 'média':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
      case 'baixa':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
}