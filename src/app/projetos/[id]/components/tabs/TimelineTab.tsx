import React, { useMemo } from 'react'
import { Calendar, Clock, Target, CheckCircle, AlertTriangle, User, MoreHorizontal } from 'lucide-react'

interface TimelineTabProps {
  milestones: Array<{
    id: string
    title: string
    status: string
    due_date?: string
    deadline?: string
    progress_percentage: number
    responsible?: { full_name: string }
  }>
  activities: Array<{
    id: string
    title: string
    status: string
    due_date?: string
    deadline?: string
    responsible?: { full_name: string }
    type?: string
  }>
  loading?: boolean
}

// Status mapping
const STATUS_CONFIG = {
  'completed': { label: 'concluído', color: 'bg-green-500', textColor: 'text-green-700' },
  'Concluído': { label: 'concluído', color: 'bg-green-500', textColor: 'text-green-700' },
  'in_progress': { label: 'andamento', color: 'bg-blue-500', textColor: 'text-blue-700' },
  'pending': { label: 'pendente', color: 'bg-gray-400', textColor: 'text-gray-600' },
  'delayed': { label: 'atrasado', color: 'bg-red-500', textColor: 'text-red-700' }
}

const getStatusConfig = (status: string, dueDate?: string) => {
  const now = new Date()
  const due = dueDate ? new Date(dueDate) : null
  
  // Se está atrasado (prazo vencido e não concluído)
  if (due && due < now && !['completed', 'Concluído'].includes(status)) {
    return STATUS_CONFIG.delayed
  }
  
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
}

// Generate weeks for timeline header
const generateWeeks = (startDate: Date, endDate: Date) => {
  const weeks = []
  const current = new Date(startDate)
  current.setDate(current.getDate() - current.getDay()) // Start on Sunday
  
  while (current <= endDate) {
    weeks.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }
  
  return weeks
}

// Calculate position on timeline
const calculatePosition = (itemDate: Date, startDate: Date, totalDays: number) => {
  const daysDiff = Math.max(0, (itemDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.min(100, (daysDiff / totalDays) * 100)
}

export const TimelineTab = ({ milestones, activities, loading = false }: TimelineTabProps) => {
  
  const timelineData = useMemo(() => {
    const allItems = [
      ...milestones.map(m => ({ ...m, type: 'milestone' as const })),
      ...activities.map(a => ({ ...a, type: 'activity' as const }))
    ].filter(item => item.due_date || item.deadline)

    if (allItems.length === 0) return null

    // Calculate date range
    const dates = allItems.map(item => new Date(item.due_date || item.deadline!))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    // Add buffer
    const startDate = new Date(minDate)
    startDate.setDate(startDate.getDate() - 7)
    const endDate = new Date(maxDate)
    endDate.setDate(endDate.getDate() + 14)
    
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const weeks = generateWeeks(startDate, endDate)

    return {
      items: allItems,
      startDate,
      endDate,
      totalDays,
      weeks
    }
  }, [milestones, activities])

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalMilestones = milestones.length
    const completedMilestones = milestones.filter(m => 
      ['completed', 'Concluído'].includes(m.status)
    ).length
    
    const totalActivities = activities.length
    const completedActivities = activities.filter(a => 
      ['completed', 'Concluído', 'approved', 'delivered'].includes(a.status)
    ).length
    
    const now = new Date()
    const delayedMilestones = milestones.filter(item => {
      const due = item.due_date || item.deadline
      return due && new Date(due) < now && !['completed', 'Concluído'].includes(item.status)
    }).length

    const inProgressActivities = activities.filter(a => 
      ['in_progress', 'pending'].includes(a.status) && 
      !['completed', 'Concluído', 'approved', 'delivered'].includes(a.status)
    ).length

    const delayedActivities = activities.filter(item => {
      const due = item.due_date || item.deadline
      return due && new Date(due) < now && !['completed', 'Concluído', 'approved', 'delivered'].includes(item.status)
    }).length

    return {
      completedMilestones,
      inProgressMilestones: totalMilestones - completedMilestones,
      completedActivities,
      inProgressActivities,
      delayedMilestones,
      delayedActivities
    }
  }, [milestones, activities])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!timelineData || timelineData.items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Cronograma do Projeto
          </h2>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item com prazo definido</h3>
            <p className="text-gray-600">
              Adicione marcos e atividades com prazos na aba "Marcos e Entregáveis" para visualizar o cronograma.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Cronograma do Projeto
          <span className="ml-2 text-sm text-gray-500">Gráfico de Gantt e marcos principais</span>
        </h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{stats.completedMilestones}</span>
            </div>
            <p className="text-sm text-gray-600">Marcos Concluídos</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{stats.inProgressMilestones}</span>
            </div>
            <p className="text-sm text-gray-600">Em Andamento</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{stats.completedActivities}</span>
            </div>
            <p className="text-sm text-gray-600">Atividades Concluídas</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{stats.delayedMilestones}</span>
            </div>
            <p className="text-sm text-gray-600">Marcos Atrasados</p>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Gráfico de Gantt</h3>
        </div>
        
        <div className="overflow-x-auto relative">
          {/* Timeline Header */}
          <div className="min-w-[1000px] border-b border-gray-200 bg-gray-50">
            <div className="flex">
              <div className="w-96 p-4 bg-gray-50 border-r border-gray-200 font-semibold text-gray-700">
                Tarefa
              </div>
              <div className="flex-1 relative bg-white">
                <div className="flex">
                  {timelineData.weeks.map((week, index) => (
                    <div key={index} className="flex-1 min-w-[80px] text-center py-3 px-2 border-r border-gray-200 text-xs">
                      <div className="font-semibold text-gray-800">
                        {week.getDate().toString().padStart(2, '0')} de
                      </div>
                      <div className="text-gray-600">
                        {week.toLocaleDateString('pt-BR', { month: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Items */}
          <div className="min-w-[1000px] bg-white">
            {timelineData.items.map((item, index) => {
              const itemDate = new Date(item.due_date || item.deadline!)
              const position = calculatePosition(itemDate, timelineData.startDate, timelineData.totalDays)
              const statusConfig = getStatusConfig(item.status, item.due_date || item.deadline)
              const progress = item.type === 'milestone' ? (item as any).progress_percentage || 0 : 
                              ['completed', 'Concluído'].includes(item.status) ? 100 : 0

              return (
                <div key={item.id} className={`flex border-b border-gray-100 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  {/* Task Info */}
                  <div className="w-96 p-4 border-r border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {item.type === 'milestone' ? (
                          <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                        ) : (
                          <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm leading-relaxed mb-1">{item.title}</p>
                        {item.responsible?.full_name && (
                          <p className="text-xs text-gray-600 flex items-center mb-2">
                            <User className="w-3 h-3 mr-1" />
                            {item.responsible.full_name}
                          </p>
                        )}
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative py-6 px-4">
                    <div className="relative h-6">
                      {item.type === 'milestone' ? (
                        <div 
                          className="absolute top-0 w-3 h-6 transform -translate-x-1/2"
                          style={{ left: `${position}%` }}
                        >
                          <div className={`w-3 h-3 rounded-full ${statusConfig.color} border-2 border-white shadow-md`}></div>
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                            {itemDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={`absolute top-1 h-4 rounded-full ${statusConfig.color} shadow-sm flex items-center`}
                          style={{ 
                            left: `${Math.max(0, position - 5)}%`,
                            width: `${Math.max(8, Math.min(progress / 5, 15))}%`
                          }}
                        >
                          {progress > 25 && (
                            <span className="text-white text-xs font-medium px-2 truncate">
                              {progress}%
                            </span>
                          )}
                          <div className="absolute top-5 left-0 text-xs text-gray-600 whitespace-nowrap">
                            {itemDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-12 p-4 border-l border-gray-200 flex items-center justify-center">
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimelineTab