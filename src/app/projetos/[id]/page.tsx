// src/app/projetos/[id]/page.tsx - VERSÃO REFATORADA
'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  BarChart3, 
  Target, 
  Calendar, 
  MessageSquare 
} from 'lucide-react'
import { 
  LoadingSpinner, 
  ErrorDisplay, 
  StatusBadge,
  CardSkeleton
} from './components/shared'
import { 
  NewMilestoneModal, 
  NewActivityModal, 
  EditItemModal 
} from './components/modals'
import { 
  ProjectDetails, 
  Milestone, 
  Activity, 
  TabId, 
  ModalState,
  MilestoneFormData,
  ActivityFormData
} from './types/project.types'
import { useProjectData } from './hooks/useProjectData'
import { MilestoneHandlers, ActivityHandlers } from './handlers/ProjectHandlers'

// === LAZY LOADED TABS ===
const OverviewTab = lazy(() => import('./components/tabs/OverviewTab'))
const DeliverablesTab = lazy(() => import('./components/tabs/DeliverablesTab'))
const TimelineTab = lazy(() => import('./components/tabs/TimelineTab'))
const CommunicationTab = lazy(() => import('./components/tabs/CommunicationTab'))

// === TAB SKELETON ===
const TabSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 3 }, (_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
)

// === COMPONENTE PRINCIPAL ===
export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  // === ESTADOS DE UI ===
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [mounted, setMounted] = useState(false)
  const [modals, setModals] = useState<ModalState>({
    isNewMilestoneModalOpen: false,
    isNewActivityModalOpen: false,
    editingItem: null
  })

  // === DADOS DO PROJETO ===
  const {
    project,
    milestones,
    activities,
    teamMembers,
    kpis,
    loading,
    error,
    refetchAll,
    updateProject,
    addMilestone,
    updateMilestone,
    removeMilestone,
    addActivity,
    updateActivity,
    removeActivity
  } = useProjectData(projectId)

  // === EFFECTS ===
  useEffect(() => {
    setMounted(true)
  }, [])

  // === HANDLERS DE MODAL ===
  const openModal = (modalType: keyof ModalState, value: any = true) => {
    setModals(prev => ({ ...prev, [modalType]: value }))
  }

  const closeModal = (modalType: keyof ModalState) => {
    setModals(prev => ({ ...prev, [modalType]: modalType === 'editingItem' ? null : false }))
  }

  // === HANDLERS DE MILESTONE ===
  const handleNewMilestone = async (formData: MilestoneFormData) => {
    const result = await MilestoneHandlers.create(projectId, formData)
    
    if (result.error) {
      alert(result.error)
      return
    }

    if (result.data) {
      addMilestone(result.data)
      closeModal('isNewMilestoneModalOpen')
      alert('Marco criado com sucesso!')
    }
  }

  const handleEditMilestone = (milestone: Milestone) => {
    openModal('editingItem', { ...milestone, type: 'marco' })
  }

  const handleUpdateMilestone = async (formData: any) => {
    if (!modals.editingItem) return

    const result = await MilestoneHandlers.update(modals.editingItem.id, formData)
    
    if (result.error) {
      alert(result.error)
      return
    }

    if (result.data) {
      updateMilestone(modals.editingItem.id, result.data)
      closeModal('editingItem')
      alert('Marco atualizado com sucesso!')
    }
  }

  const handleDeleteMilestone = async (milestoneId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir o marco "${title}"?`)) return

    const result = await MilestoneHandlers.delete(milestoneId)
    
    if (result.error) {
      alert(result.error)
      return
    }

    removeMilestone(milestoneId)
    alert('Marco excluído com sucesso!')
  }

  // === HANDLERS DE ACTIVITY ===
  const handleNewActivity = async (formData: ActivityFormData) => {
    const result = await ActivityHandlers.create(projectId, formData)
    
    if (result.error) {
      alert(result.error)
      return
    }

    if (result.data) {
      addActivity(result.data)
      closeModal('isNewActivityModalOpen')
      alert('Atividade criada com sucesso!')
    }
  }

  const handleEditActivity = (activity: Activity) => {
    openModal('editingItem', { ...activity, type: 'atividade' })
  }

  const handleUpdateActivity = async (formData: any) => {
    if (!modals.editingItem) return

    const result = await ActivityHandlers.update(modals.editingItem.id, formData)
    
    if (result.error) {
      alert(result.error)
      return
    }

    if (result.data) {
      updateActivity(modals.editingItem.id, result.data)
      closeModal('editingItem')
      alert('Atividade atualizada com sucesso!')
    }
  }

  const handleDeleteActivity = async (activityId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir a atividade "${title}"?`)) return

    const result = await ActivityHandlers.delete(activityId)
    
    if (result.error) {
      alert(result.error)
      return
    }

    removeActivity(activityId)
    alert('Atividade excluída com sucesso!')
  }

  // === HANDLERS UNIFICADOS PARA MODAL DE EDIÇÃO ===
  const handleUpdateItem = async (formData: any) => {
    if (!modals.editingItem) return

    if (modals.editingItem.type === 'marco') {
      await handleUpdateMilestone(formData)
    } else {
      await handleUpdateActivity(formData)
    }
  }

  // === CONFIGURAÇÃO DAS TABS ===
  const tabs = [
    { 
      id: 'overview' as TabId, 
      label: 'Visão Geral', 
      icon: BarChart3,
      component: OverviewTab,
      props: { project, kpis }
    },
    { 
      id: 'deliverables' as TabId, 
      label: 'Marcos e Entregáveis', 
      icon: Target,
      component: DeliverablesTab,
      props: {
        milestones,
        activities,
        teamMembers,
        onNewMilestone: () => openModal('isNewMilestoneModalOpen'),
        onNewActivity: () => openModal('isNewActivityModalOpen'),
        onEditMilestone: handleEditMilestone,
        onEditActivity: handleEditActivity,
        onDeleteMilestone: handleDeleteMilestone,
        onDeleteActivity: handleDeleteActivity
      }
    },
    { 
      id: 'timeline' as TabId, 
      label: 'Cronograma', 
      icon: Calendar,
      component: TimelineTab,
      props: { milestones, activities }
    },
    { 
      id: 'communication' as TabId, 
      label: 'Comunicação', 
      icon: MessageSquare,
      component: CommunicationTab,
      props: { projectId }
    }
  ]

  // === RENDER CONDITIONAL ===
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50"></div>
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingSpinner message="Carregando projeto..." />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorDisplay 
          error={error} 
          onRetry={refetchAll}
          title="Erro ao carregar projeto"
        />
      </div>
    )
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorDisplay 
          error="Projeto não encontrado" 
          onRetry={refetchAll}
        />
      </div>
    )
  }

  // === RENDER PRINCIPAL ===
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header Fixo */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-6">
          
          {/* Navegação e Título */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/projetos')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Voltar para projetos"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <StatusBadge status={project.status} type="generic" />
                  <StatusBadge status={project.health} type="health" />
                </div>
              </div>
            </div>
            
            {/* Ação Principal */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/projetos/${projectId}/edit`
                }
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Editar Projeto</span>
            </button>
          </div>

          {/* Navegação de Tabs */}
          <div className="flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="max-w-7xl mx-auto p-6">
        {tabs.map(tab => {
          if (tab.id !== activeTab) return null
          
          const TabComponent = tab.component

          return (
            <Suspense key={tab.id} fallback={<TabSkeleton />}>
              <TabComponent 
                {...tab.props}
                loading={loading}
              />
            </Suspense>
          )
        })}
      </div>

      {/* Modais */}
      <NewMilestoneModal
        isOpen={modals.isNewMilestoneModalOpen}
        onClose={() => closeModal('isNewMilestoneModalOpen')}
        onSubmit={handleNewMilestone}
        teamMembers={teamMembers}
      />

      <NewActivityModal
        isOpen={modals.isNewActivityModalOpen}
        onClose={() => closeModal('isNewActivityModalOpen')}
        onSubmit={handleNewActivity}
        teamMembers={teamMembers}
      />

      <EditItemModal
        isOpen={!!modals.editingItem}
        onClose={() => closeModal('editingItem')}
        onSubmit={handleUpdateItem}
        item={modals.editingItem}
        teamMembers={teamMembers}
      />
    </div>
  )
}