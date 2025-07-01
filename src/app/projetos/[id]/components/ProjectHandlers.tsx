// src/app/projetos/[id]/components/ProjectHandlers.tsx - VERSÃO INTEGRADA
import { supabase } from '@/lib/supabase'

export const ProjectHandlers = {
  
  // ================================
  // CRIAR MARCO (ATUALIZADO COM STATUS)
  // ================================
  async handleNewMilestone(
    projectId: string, 
    formData: FormData, 
    teamMembers: any[], 
    setMilestones: any, 
    setIsNewMilestoneModalOpen: any, 
    milestones: any[]
  ) {
    try {
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const deadline = formData.get('deadline') as string
      const responsibleId = formData.get('responsible_id') as string
      const status = formData.get('status') as string || 'pending' // DEFAULT

      // Validações básicas
      if (!title?.trim()) {
        alert('Título é obrigatório')
        return
      }

      // Validar status
      if (!this.validateMilestoneStatus(status)) {
        alert('Status inválido para marco')
        return
      }

      console.log('Creating milestone with status:', status)

      const { data, error } = await supabase
        .from('project_milestones')
        .insert([{
          project_id: projectId,
          title: title.trim(),
          description: description?.trim() || null,
          due_date: deadline || null,
          assigned_to: responsibleId || null,
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
        
        if (error.code === '23514') {
          alert('Status inválido. Use: pending, in_progress, completed, delayed, cancelled')
        } else if (error.code === '42501') {
          alert('Erro de permissão - RLS pode estar ativo - execute o SQL de correção')
        } else {
          alert(`Erro ao criar marco: ${error.message}`)
        }
        return
      }

      console.log('✅ Marco criado com sucesso:', data)

      // Atualizar lista de marcos
      setMilestones([...milestones, data])
      setIsNewMilestoneModalOpen(false)
      
      alert('Marco criado com sucesso!')

    } catch (err) {
      console.error('💥 Erro inesperado:', err)
      alert('Erro inesperado ao criar marco. Tente novamente.')
    }
  },

  // ================================
  // CRIAR ATIVIDADE (ATUALIZADO COM STATUS)
  // ================================
  async handleNewActivity(
    projectId: string, 
    formData: FormData, 
    teamMembers: any[], 
    setActivities: any, 
    setIsNewActivityModalOpen: any, 
    activities: any[]
  ) {
    try {
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const deadline = formData.get('deadline') as string
      const category = formData.get('category') as string
      const responsibleId = formData.get('responsible_id') as string
      const status = formData.get('status') as string || 'draft' // DEFAULT

      // Validações básicas
      if (!title?.trim()) {
        alert('Título é obrigatório')
        return
      }

      if (!category) {
        alert('Categoria é obrigatória')
        return
      }

      // Validar status e categoria
      if (!this.validateActivityStatus(status)) {
        alert('Status inválido para atividade')
        return
      }

      if (!this.validateActivityType(category)) {
        alert('Categoria inválida')
        return
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
          assigned_to: responsibleId || null,
          status: status
        }])
        .select(`
          *,
          responsible:team_members(id, full_name)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao criar entregável:', error)
        
        if (error.code === '23514') {
          if (error.message.includes('type')) {
            alert('Tipo inválido. Use: documentation, code, interface, testing, infrastructure, analysis')
          } else if (error.message.includes('status')) {
            alert('Status inválido. Use: draft, in_progress, review, approved, delivered, cancelled')
          }
        } else if (error.code === '42501') {
          alert('Erro de permissão - RLS pode estar ativo - execute o SQL de correção')
        } else {
          alert(`Erro ao criar atividade: ${error.message}`)
        }
        return
      }

      console.log('✅ Atividade criada com sucesso:', data)

      // Atualizar lista
      setActivities([...activities, data])
      setIsNewActivityModalOpen(false)
      
      alert('Atividade criada com sucesso!')

    } catch (err) {
      console.error('💥 Erro inesperado:', err)
      alert('Erro inesperado ao criar atividade. Tente novamente.')
    }
  },

  // ================================
  // ATUALIZAR MARCO (MANTIDO + STATUS)
  // ================================
  async handleUpdateMilestone(milestoneId: string, updates: any, setMilestones: any, milestones: any[]) {
    try {
      // Mapear status PT -> EN se necessário
      const statusMapping: Record<string, string> = {
        'Pendente': 'pending',
        'Em Andamento': 'in_progress',
        'Concluído': 'completed',
        'Atrasado': 'delayed',
        'Cancelado': 'cancelled'
      }

      const mappedStatus = updates.status ? statusMapping[updates.status] || updates.status : undefined

      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      if (mappedStatus) {
        updateData.status = mappedStatus
        // Se marcado como concluído, progresso = 100%
        if (mappedStatus === 'completed') {
          updateData.progress_percentage = 100
        }
      }

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
        alert(`Erro ao atualizar marco: ${error.message}`)
        return
      }

      // Atualizar lista
      setMilestones(milestones.map(m => m.id === milestoneId ? data : m))
      
      return data

    } catch (err) {
      console.error('💥 Erro ao atualizar marco:', err)
      alert('Erro inesperado ao atualizar marco.')
    }
  },

  // ================================
  // ATUALIZAR ATIVIDADE (MANTIDO + STATUS)  
  // ================================
  async handleUpdateActivity(activityId: string, updates: any, setActivities: any, activities: any[]) {
    try {
      // Mapear status PT -> EN
      const statusMapping: Record<string, string> = {
        'Rascunho': 'draft',
        'Em Progresso': 'in_progress',
        'Em Revisão': 'review', 
        'Aprovado': 'approved',
        'Entregue': 'delivered',
        'Cancelado': 'cancelled'
      }

      const mappedStatus = updates.status ? statusMapping[updates.status] || updates.status : undefined

      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      if (mappedStatus) {
        updateData.status = mappedStatus
      }

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
        console.error('❌ Erro ao atualizar entregável:', error)
        alert(`Erro ao atualizar entregável: ${error.message}`)
        return
      }

      // Atualizar lista
      setActivities(activities.map(a => a.id === activityId ? data : a))
      
      return data

    } catch (err) {
      console.error('💥 Erro ao atualizar entregável:', err)
      alert('Erro inesperado ao atualizar entregável.')
    }
  },

  // ================================
  // DELETAR MARCO (MANTIDO)
  // ================================
  async handleDeleteMilestone(milestoneId: string, setMilestones: any, milestones: any[]) {
    if (!confirm('Tem certeza que deseja excluir este marco?')) return

    try {
      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', milestoneId)

      if (error) {
        console.error('❌ Erro ao deletar marco:', error)
        alert(`Erro ao excluir marco: ${error.message}`)
        return
      }

      // Remover da lista
      setMilestones(milestones.filter(m => m.id !== milestoneId))
      alert('Marco excluído com sucesso!')

    } catch (err) {
      console.error('💥 Erro ao deletar marco:', err)
      alert('Erro inesperado ao excluir marco.')
    }
  },

  // ================================
  // DELETAR ATIVIDADE (MANTIDO)
  // ================================
  async handleDeleteActivity(activityId: string, setActivities: any, activities: any[]) {
    if (!confirm('Tem certeza que deseja excluir este entregável?')) return

    try {
      const { error } = await supabase
        .from('project_deliverables')
        .delete()
        .eq('id', activityId)

      if (error) {
        console.error('❌ Erro ao deletar entregável:', error)
        alert(`Erro ao excluir entregável: ${error.message}`)
        return
      }

      // Remover da lista
      setActivities(activities.filter(a => a.id !== activityId))
      alert('Entregável excluído com sucesso!')

    } catch (err) {
      console.error('💥 Erro ao deletar entregável:', err)
      alert('Erro inesperado ao excluir entregável.')
    }
  },

  // ================================
  // HELPERS PARA STATUS (NOVOS)
  // ================================
  getMilestoneStatusBadge(status: string) {
    const statusMap = {
      'pending': { label: 'Pendente', color: 'bg-gray-100 text-gray-800' },
      'in_progress': { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
      'completed': { label: 'Concluído', color: 'bg-green-100 text-green-800' },
      'delayed': { label: 'Atrasado', color: 'bg-red-100 text-red-800' },
      'cancelled': { label: 'Cancelado', color: 'bg-gray-100 text-gray-600' }
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-100 text-gray-800' }
  },

  getActivityStatusBadge(status: string) {
    const statusMap = {
      'draft': { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
      'in_progress': { label: 'Em Progresso', color: 'bg-blue-100 text-blue-800' },
      'review': { label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-800' },
      'approved': { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
      'delivered': { label: 'Entregue', color: 'bg-purple-100 text-purple-800' },
      'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-100 text-gray-800' }
  },

  // ================================
  // VALIDAÇÕES (NOVAS)
  // ================================
  validateMilestoneStatus(status: string): boolean {
    const validStatuses = ['pending', 'in_progress', 'completed', 'delayed', 'cancelled']
    return validStatuses.includes(status)
  },

  validateActivityStatus(status: string): boolean {
    const validStatuses = ['draft', 'in_progress', 'review', 'approved', 'delivered', 'cancelled']
    return validStatuses.includes(status)
  },

  validateActivityType(type: string): boolean {
    const validTypes = ['documentation', 'code', 'interface', 'testing', 'infrastructure', 'analysis']
    return validTypes.includes(type)
  },

  // ================================
  // MAPEAMENTOS PARA SELECTS (NOVOS)
  // ================================
  getMilestoneStatusOptions() {
    return [
      { value: 'pending', label: 'Pendente' },
      { value: 'in_progress', label: 'Em Andamento' },
      { value: 'completed', label: 'Concluído' },
      { value: 'delayed', label: 'Atrasado' },
      { value: 'cancelled', label: 'Cancelado' }
    ]
  },

  getActivityStatusOptions() {
    return [
      { value: 'draft', label: 'Rascunho' },
      { value: 'in_progress', label: 'Em Progresso' },
      { value: 'review', label: 'Em Revisão' },
      { value: 'approved', label: 'Aprovado' },
      { value: 'delivered', label: 'Entregue' },
      { value: 'cancelled', label: 'Cancelado' }
    ]
  },

  getActivityTypeOptions() {
    return [
      { value: 'documentation', label: 'Documento', icon: '📄' },
      { value: 'code', label: 'Código', icon: '💻' },
      { value: 'interface', label: 'Interface', icon: '🎨' },
      { value: 'testing', label: 'Teste', icon: '🧪' },
      { value: 'infrastructure', label: 'Infraestrutura', icon: '⚙️' },
      { value: 'analysis', label: 'Análise', icon: '📊' }
    ]
  }
}