// src/app/projetos/[id]/components/ProjectHandlers.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ProjectHandlersProps {
  projectId: string
  milestones: any[]
  activities: any[]
  teamMembers: any[]
  setMilestones: (data: any[]) => void
  setActivities: (data: any[]) => void
  setIsNewMilestoneModalOpen: (open: boolean) => void
  setIsNewActivityModalOpen: (open: boolean) => void
}

export default function ProjectHandlers({
  projectId,
  milestones,
  activities,
  teamMembers,
  setMilestones,
  setActivities,
  setIsNewMilestoneModalOpen,
  setIsNewActivityModalOpen
}: ProjectHandlersProps) {

  // ================================
  // HANDLERS PARA MARCOS
  // ================================
  const handleNewMilestone = async (formData: FormData) => {
    try {
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const deadline = formData.get('deadline') as string
      const responsibleId = formData.get('responsible_id') as string

      // Validações básicas
      if (!title?.trim()) {
        alert('Título é obrigatório')
        return
      }

      console.log('Creating milestone with data:', {
        project_id: projectId,
        title: title.trim(),
        description: description?.trim() || null,
        due_date: deadline || null,
        assigned_to: responsibleId || null,
        status: 'not_started',
        progress_percentage: 0
      })

      const { data, error } = await supabase
        .from('project_milestones')
        .insert([{
          project_id: projectId,
          title: title.trim(),
          description: description?.trim() || null,
          due_date: deadline || null,
          assigned_to: responsibleId || null,
          status: 'not_started', // Usar valor válido do check constraint
          progress_percentage: 0
        }])
        .select(`
          *,
          responsible:team_members(id, full_name)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao criar marco:', error)
        
        // Mensagens de erro específicas
        if (error.code === '23514') {
          alert('Erro: Status inválido. Use: not_started, in_progress, completed, cancelled, ou on_hold')
        } else if (error.code === '42501') {
          alert('Erro: Permissão negada. RLS pode estar ativo - execute o SQL de correção')
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
  }

const handleNewActivity = async (formData: FormData) => {
  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const deadline = formData.get('deadline') as string
    const category = formData.get('category') as string
    const status = formData.get('status') as string
    const responsibleId = formData.get('responsible_id') as string

    console.log('🔍 Dados recebidos do form:', {
      title, description, deadline, category, status, responsibleId
    })

    // Validações básicas
    if (!title?.trim()) {
      alert('❌ Título é obrigatório')
      return
    }

    // MAPEAMENTO CATEGORIA PT → EN
    const categoryMapping: Record<string, string> = {
      'Documento': 'documentation',
      'Código': 'code',
      'Interface': 'interface',
      'Teste': 'testing',
      'Infraestrutura': 'infrastructure',
      'Análise': 'analysis'
    }

    // MAPEAMENTO STATUS PT → EN 
    const statusMapping: Record<string, string> = {
      'Pendente': 'draft',
      'Em Andamento': 'in_progress', 
      'Em Revisão': 'review',
      'Aprovado': 'approved',
      'Concluído': 'delivered',
      'Atrasado': 'cancelled'
    }

    const mappedCategory = categoryMapping[category]
    const mappedStatus = status ? statusMapping[status] || 'draft' : 'draft'
    
    if (!mappedCategory) {
      alert(`❌ Categoria "${category}" inválida. Use: Documento, Código, Interface, Teste, Infraestrutura ou Análise`)
      return
    }

    console.log('🔄 Mapeamentos:', {
      categoria: `${category} → ${mappedCategory}`,
      status: `${status || 'N/A'} → ${mappedStatus}`
    })

    // Dados para inserção
    const insertData = {
      project_id: projectId,
      title: title.trim(),
      description: description?.trim() || null,
      type: mappedCategory,
      status: mappedStatus,
      due_date: deadline || null,
      assigned_to: responsibleId || null
    }

    console.log('📝 Inserindo:', insertData)

    const { data, error } = await supabase
      .from('project_deliverables')
      .insert([insertData])
      .select(`
        *,
        responsible:team_members(id, full_name, email)
      `)
      .single()

    if (error) {
      console.error('❌ Erro do Supabase:', error)
      
      if (error.code === '23514') {
        if (error.message.includes('valid_deliverable_type')) {
          alert('❌ Tipo inválido. Execute o SQL de correção.')
        } else if (error.message.includes('valid_deliverable_status')) {
          alert('❌ Status inválido. Execute o SQL de correção.')
        } else {
          alert(`❌ Constraint: ${error.message}`)
        }
      } else if (error.code === '42501') {
        alert('❌ RLS ativo. Execute: ALTER TABLE project_deliverables DISABLE ROW LEVEL SECURITY;')
      } else {
        alert(`❌ Erro: ${error.message}`)
      }
      return
    }

    console.log('✅ Criado:', data)
    setActivities([...activities, data])
    setIsNewActivityModalOpen(false)
    alert('✅ Atividade criada!')

  } catch (err) {
    console.error('💥 Erro:', err)
    alert(`💥 Erro: ${err.message || 'Desconhecido'}`)

// ================================
// FUNÇÃO DE DEBUG ADICIONAL
// ================================

const debugDatabaseConstraints = async () => {
  try {
    console.log('🔍 Debugando constraints do banco...')
    
    // Testar inserção direta para debug
    const testData = {
      project_id: projectId,
      title: 'TESTE DEBUG',
      type: 'documentation',
      status: 'draft'
    }

    const { data, error } = await supabase
      .from('project_deliverables')
      .insert([testData])
      .select()

    if (error) {
      console.error('❌ Erro no teste:', error)
    } else {
      console.log('✅ Teste passou:', data)
      
      // Limpar teste
      await supabase
        .from('project_deliverables')
        .delete()
        .eq('id', data[0].id)
    }

  } catch (err) {
    console.error('💥 Erro no debug:', err)
  }
}

// Para usar o debug, chame: debugDatabaseConstraints()

// ================================
// VALIDAÇÃO DOS SELECTS NO MODAL
// ================================

// Certifique-se que o select de categoria tem exatamente estes valores:
const categoryOptions = [
  { value: 'Documento', label: 'Documento' },
  { value: 'Código', label: 'Código' },
  { value: 'Interface', label: 'Interface' },
  { value: 'Teste', label: 'Teste' },
  { value: 'Infraestrutura', label: 'Infraestrutura' },
  { value: 'Análise', label: 'Análise' }
]
  // ================================
  // ATUALIZAR MARCO
  // ================================
  const handleUpdateMilestone = async (milestoneId: string, updates: any) => {
    try {
      // Mapear status PT -> EN
      const statusMapping: Record<string, string> = {
        'Não Iniciado': 'not_started',
        'Em Progresso': 'in_progress', 
        'Concluído': 'completed',
        'Cancelado': 'cancelled',
        'Pausado': 'on_hold'
      }

      const mappedStatus = updates.status ? statusMapping[updates.status] || updates.status : undefined

      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      if (mappedStatus) {
        updateData.status = mappedStatus
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
  }

  // ================================
  // ATUALIZAR ENTREGÁVEL  
  // ================================
  const handleUpdateActivity = async (activityId: string, updates: any) => {
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
  }

  // ================================
  // DELETAR MARCO
  // ================================
  const handleDeleteMilestone = async (milestoneId: string) => {
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
  }

  // ================================
  // DELETAR ENTREGÁVEL
  // ================================
  const handleDeleteActivity = async (activityId: string) => {
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
  }

  // ================================
  // UTILIDADES
  // ================================
  const getValidStatuses = (type: 'milestone' | 'deliverable') => {
    if (type === 'milestone') {
      return [
        { value: 'not_started', label: 'Não Iniciado' },
        { value: 'in_progress', label: 'Em Progresso' },
        { value: 'completed', label: 'Concluído' },
        { value: 'cancelled', label: 'Cancelado' },
        { value: 'on_hold', label: 'Pausado' }
      ]
    } else {
      return [
        { value: 'draft', label: 'Rascunho' },
        { value: 'in_progress', label: 'Em Progresso' },
        { value: 'review', label: 'Em Revisão' },
        { value: 'approved', label: 'Aprovado' },
        { value: 'delivered', label: 'Entregue' },
        { value: 'cancelled', label: 'Cancelado' }
      ]
    }
  }

  const getValidTypes = () => {
    return [
      { value: 'documentation', label: 'Documento' },
      { value: 'code', label: 'Código' },
      { value: 'interface', label: 'Interface' },
      { value: 'testing', label: 'Teste' },
      { value: 'infrastructure', label: 'Infraestrutura' },
      { value: 'analysis', label: 'Análise' }
    ]
  }

  // Retornar handlers para uso nos componentes
  return {
    handleNewMilestone,
    handleNewActivity,
    handleUpdateMilestone,
    handleUpdateActivity,
    handleDeleteMilestone,
    handleDeleteActivity,
    getValidStatuses,
    getValidTypes
  }
}