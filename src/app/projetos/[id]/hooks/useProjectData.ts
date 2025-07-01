// src/app/projetos/[id]/hooks/useProjectData.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ProjectDetails,
  Milestone,
  Activity,
  TeamMember,
  ProjectKPIs,
  ProjectResponse,
  MilestonesResponse,
  ActivitiesResponse,
  TeamMembersResponse
} from '../types/project.types'

// === HOOK PRINCIPAL DO PROJETO ===
export const useProject = (projectId: string) => {
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProject = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, company_name),
          manager:team_members(id, full_name)
        `)
        .eq('id', projectId)
        .single()

      if (fetchError) throw new Error(fetchError.message)
      if (!data) throw new Error('Projeto não encontrado')

      setProject(data as ProjectDetails)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao carregar projeto:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const updateProject = useCallback((updates: Partial<ProjectDetails>) => {
    if (project) {
      setProject({ ...project, ...updates })
    }
  }, [project])

  return {
    project,
    loading,
    error,
    refetch: loadProject,
    updateProject
  }
}

// === HOOK PARA MARCOS ===
export const useMilestones = (projectId: string) => {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMilestones = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('project_milestones')
        .select(`
          *,
          responsible:team_members(id, full_name)
        `)
        .eq('project_id', projectId)
        .order('due_date', { ascending: true })

      if (fetchError) {
        console.error('Erro ao carregar marcos:', fetchError)
        setMilestones([])
        return
      }

      setMilestones(data || [])
    } catch (err) {
      console.error('Erro ao carregar marcos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar marcos')
      setMilestones([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadMilestones()
  }, [loadMilestones])

  const addMilestone = useCallback((milestone: Milestone) => {
    setMilestones(prev => [...prev, milestone])
  }, [])

  const updateMilestone = useCallback((id: string, updates: Partial<Milestone>) => {
    setMilestones(prev => 
      prev.map(m => m.id === id ? { ...m, ...updates } : m)
    )
  }, [])

  const removeMilestone = useCallback((id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id))
  }, [])

  return {
    milestones,
    loading,
    error,
    refetch: loadMilestones,
    addMilestone,
    updateMilestone,
    removeMilestone
  }
}

// === HOOK PARA ATIVIDADES ===
export const useActivities = (projectId: string) => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadActivities = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('project_deliverables')
        .select(`
          *,
          responsible:team_members(id, full_name)
        `)
        .eq('project_id', projectId)
        .order('due_date', { ascending: true })

      if (fetchError) {
        console.error('Erro ao carregar atividades:', fetchError)
        setActivities([])
        return
      }

      setActivities(data || [])
    } catch (err) {
      console.error('Erro ao carregar atividades:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar atividades')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const addActivity = useCallback((activity: Activity) => {
    setActivities(prev => [...prev, activity])
  }, [])

  const updateActivity = useCallback((id: string, updates: Partial<Activity>) => {
    setActivities(prev => 
      prev.map(a => a.id === id ? { ...a, ...updates } : a)
    )
  }, [])

  const removeActivity = useCallback((id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id))
  }, [])

  return {
    activities,
    loading,
    error,
    refetch: loadActivities,
    addActivity,
    updateActivity,
    removeActivity
  }
}

// === HOOK PARA MEMBROS DA EQUIPE ===
export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTeamMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('full_name')

      if (fetchError) throw new Error(fetchError.message)

      setTeamMembers(data || [])
    } catch (err) {
      console.error('Erro ao carregar membros da equipe:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipe')
      setTeamMembers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeamMembers()
  }, [loadTeamMembers])

  return {
    teamMembers,
    loading,
    error,
    refetch: loadTeamMembers
  }
}

// === HOOK PARA KPIs CALCULADOS ===
export const useProjectKPIs = (
  project: ProjectDetails | null,
  milestones: Milestone[],
  activities: Activity[]
) => {
  const [kpis, setKpis] = useState<ProjectKPIs>({
    totalMilestones: 0,
    completedMilestones: 0,
    totalActivities: 0,
    completedActivities: 0,
    overallProgress: 0,
    daysRemaining: 0,
    budgetUtilization: 0,
    activeRisks: 0
  })

  const calculateKPIs = useCallback(() => {
    if (!project) {
      setKpis({
        totalMilestones: 0,
        completedMilestones: 0,
        totalActivities: 0,
        completedActivities: 0,
        overallProgress: 0,
        daysRemaining: 0,
        budgetUtilization: 0,
        activeRisks: 0
      })
      return
    }

    // Marcos concluídos
    const completedMilestones = milestones.filter(m => 
      m.status === 'completed' || m.status === 'Concluído'
    ).length

    // Atividades concluídas
    const completedActivities = activities.filter(a => 
      ['completed', 'approved', 'delivered', 'Concluído', 'Aprovado'].includes(a.status)
    ).length

    // Progresso geral
    const totalItems = milestones.length + activities.length
    const milestonesProgress = milestones.reduce((sum, m) => sum + (m.progress_percentage || 0), 0)
    const activitiesProgress = completedActivities * 100
    
    const overallProgress = totalItems > 0 
      ? Math.round((milestonesProgress + activitiesProgress) / (totalItems * 100) * 100)
      : 0

    // Dias restantes
    const daysRemaining = project.estimated_end_date 
      ? Math.max(0, Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    // Utilização do orçamento
    const budgetUtilization = project.total_budget > 0 
      ? Math.round((project.used_budget / project.total_budget) * 100)
      : 0

    // Riscos ativos (marcos/atividades atrasados)
    const now = new Date()
    const activeRisks = [...milestones, ...activities].filter(item => {
      const dueDate = new Date(item.due_date || item.deadline || '')
      return dueDate < now && !['completed', 'approved', 'delivered', 'Concluído', 'Aprovado'].includes(item.status)
    }).length

    const newKpis: ProjectKPIs = {
      totalMilestones: milestones.length,
      completedMilestones,
      totalActivities: activities.length,
      completedActivities,
      overallProgress,
      daysRemaining,
      budgetUtilization,
      activeRisks
    }

    setKpis(newKpis)

    // Atualizar progresso do projeto no banco se necessário
    if (project.progress_percentage !== overallProgress) {
      updateProjectProgress(project.id, overallProgress)
    }
  }, [project, milestones, activities])

  useEffect(() => {
    calculateKPIs()
  }, [calculateKPIs])

  return kpis
}

// === FUNÇÃO AUXILIAR PARA ATUALIZAR PROGRESSO ===
const updateProjectProgress = async (projectId: string, newProgress: number) => {
  try {
    await supabase
      .from('projects')
      .update({ progress_percentage: newProgress })
      .eq('id', projectId)
  } catch (err) {
    console.error('Erro ao atualizar progresso do projeto:', err)
  }
}

// === HOOK COMBINADO PARA TODA A DATA DO PROJETO ===
export const useProjectData = (projectId: string) => {
  const project = useProject(projectId)
  const milestones = useMilestones(projectId)
  const activities = useActivities(projectId)
  const teamMembers = useTeamMembers()
  
  const kpis = useProjectKPIs(
    project.project,
    milestones.milestones,
    activities.activities
  )

  const loading = project.loading || milestones.loading || activities.loading || teamMembers.loading
  const error = project.error || milestones.error || activities.error || teamMembers.error

  const refetchAll = useCallback(() => {
    project.refetch()
    milestones.refetch()
    activities.refetch()
    teamMembers.refetch()
  }, [project.refetch, milestones.refetch, activities.refetch, teamMembers.refetch])

  return {
    // Data
    project: project.project,
    milestones: milestones.milestones,
    activities: activities.activities,
    teamMembers: teamMembers.teamMembers,
    kpis,
    
    // States
    loading,
    error,
    
    // Actions
    refetchAll,
    updateProject: project.updateProject,
    
    // Milestones
    addMilestone: milestones.addMilestone,
    updateMilestone: milestones.updateMilestone,
    removeMilestone: milestones.removeMilestone,
    
    // Activities
    addActivity: activities.addActivity,
    updateActivity: activities.updateActivity,
    removeActivity: activities.removeActivity
  }
}