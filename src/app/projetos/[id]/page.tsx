// src/app/projetos/[id]/page.tsx - DEBUG E CORREÇÃO
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
    console.log('🔓 Abrindo modal:', modalType, 'com valor:', value)
    setModals(prev => ({ ...prev, [modalType]: value }))
  }

  const closeModal = (modalType: keyof ModalState) => {
    console.log('🔒 Fechando modal:', modalType)
    setModals(prev => ({ ...prev, [modalType]: modalType === 'editingItem' ? null : false }))
  }

  // === HANDLERS DE MILESTONE ===
  const handleNewMilestone = async (formData: MilestoneFormData) => {
    console.log('📝 Criando novo marco:', formData)
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
    console.log('✏️ Editando marco:', milestone)
    const milestoneWithType = { ...milestone, type: 'marco' as const }
    console.log('📋 Marco com type:', milestoneWithType)
    openModal('editingItem', milestoneWithType)
  }

  const handleUpdateMilestone = async (formData: any) => {
    console.log('💾 Atualizando marco:', formData)
    if (!modals.editingItem) {
      console.log('❌ Nenhum item sendo editado')
      return
    }

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
    console.log('📝 Criando nova atividade:', formData)
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
    console.log('✏️ Editando atividade:', activity)
    const activityWithType = { ...activity, type: 'atividade' as const }
    console.log('📋 Atividade com type:', activityWithType)
    openModal('editingItem', activityWithType)
  }

  const handleUpdateActivity = async (formData: any) => {
    console.log('💾 Atualizando atividade:', formData)
    if (!modals.editingItem) {
      console.log('❌ Nenhum item sendo editado')
      return
    }

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
    console.log('🔄 Handler unificado para atualização:', {
      editingItem: modals.editingItem,
      formData: formData
    })
    
    if (!modals.editingItem) {
      console.log('❌ Nenhum item sendo editado')
      return
    }

    if (modals.editingItem.type === 'marco') {
      console.log('📍 Atualizando como marco')
      await handleUpdateMilestone(formData)
    } else {
      console.log('📝 Atualizando como atividade')
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
      props: { 
        projectId, 
        teamMembers
      }
    }
  ]

  // === RENDERS ===
  if (!mounted) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <ErrorDisplay 
        message={error} 
        onRetry={refetchAll}
      />
    )
  }

  if (loading && !project) {
    return <LoadingSpinner />
  }

  if (!project) {
    return (
      <ErrorDisplay 
        message="Projeto não encontrado" 
        onRetry={() => router.push('/projetos')}
      />
    )
  }

  // Debug do estado dos modais
  console.log('🎭 Estado dos modais:', modals)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do Projeto */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/projetos')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <StatusBadge status={project.status} />
                  <span className="text-sm text-gray-600">
                    {project.project_type}
                  </span>
                </div>
              </div>
            </div>
            <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <Edit className="w-4 h-4" />
              <span>Editar Projeto</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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

      {/* Debug Info em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm">
          <div><strong>Editing Item:</strong></div>
          <pre className="mt-1 overflow-auto max-h-32">
            {JSON.stringify(modals.editingItem, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}