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
    
    const now = new Date()
    const delayedItems = [...milestones, ...activities].filter(item => {
      const due = item.due_date || item.deadline
      return due && new Date(due) < now && !['completed', 'Concluído'].includes(item.status)
    }).length

    const daysRemaining = timelineData ? Math.max(0, 
      Math.ceil((timelineData.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    ) : 0

    return {
      completedMilestones,
      inProgressMilestones: totalMilestones - completedMilestones,
      daysRemaining,
      delayedItems
    }
  }, [milestones, activities, timelineData])

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
              <Calendar className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{stats.daysRemaining}</span>
            </div>
            <p className="text-sm text-gray-600">Dias Restantes</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{stats.delayedItems}</span>
            </div>
            <p className="text-sm text-gray-600">Marcos Atrasados</p>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Gráfico de Gantt</h3>
        </div>
        
        <div className="overflow-x-auto">
          {/* Timeline Header */}
          <div className="min-w-[800px] border-b border-gray-200">
            <div className="flex">
              <div className="w-80 p-4 bg-gray-50 border-r border-gray-200">
                <span className="font-medium text-gray-900">Tarefa</span>
              </div>
              <div className="flex-1 relative">
                <div className="flex border-b border-gray-200">
                  {timelineData.weeks.map((week, index) => (
                    <div key={index} className="flex-1 text-center p-2 border-r border-gray-100 text-xs text-gray-600">
                      <div className="font-medium">
                        {week.toLocaleDateString('pt-BR', { day: '2-digit' })} de
                      </div>
                      <div>
                        {week.toLocaleDateString('pt-BR', { month: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Items */}
          <div className="min-w-[800px]">
            {timelineData.items.map((item, index) => {
              const itemDate = new Date(item.due_date || item.deadline!)
              const position = calculatePosition(itemDate, timelineData.startDate, timelineData.totalDays)
              const statusConfig = getStatusConfig(item.status, item.due_date || item.deadline)
              const progress = item.type === 'milestone' ? (item as any).progress_percentage || 0 : 
                              ['completed', 'Concluído'].includes(item.status) ? 100 : 0

              return (
                <div key={item.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                  {/* Task Info */}
                  <div className="w-80 p-4 border-r border-gray-200">
                    <div className="flex items-start">
                      {item.type === 'milestone' ? (
                        <Target className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm leading-tight">{item.title}</p>
                        {item.responsible?.full_name && (
                          <p className="text-xs text-gray-600 mt-1 flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {item.responsible.full_name}
                          </p>
                        )}
                        <div className="flex items-center mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.textColor} bg-opacity-10`} 
                                style={{ backgroundColor: statusConfig.color.replace('bg-', '').replace('-500', '') + '20' }}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative p-4">
                    <div className="relative h-8">
                      <div 
                        className={`absolute top-1 h-6 rounded ${statusConfig.color} opacity-80 min-w-[4px] flex items-center justify-center`}
                        style={{ 
                          left: `${position}%`,
                          width: item.type === 'milestone' ? '8px' : `${Math.max(2, progress)}%`
                        }}
                      >
                        {item.type === 'activity' && progress > 15 && (
                          <span className="text-white text-xs font-medium px-1">
                            {progress}%
                          </span>
                        )}
                      </div>
                      
                      {/* Date Label */}
                      <div 
                        className="absolute top-8 text-xs text-gray-600 whitespace-nowrap"
                        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                      >
                        {itemDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-12 p-4 border-l border-gray-200">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Today Indicator */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
             style={{ 
               left: `${320 + (calculatePosition(new Date(), timelineData.startDate, timelineData.totalDays) / 100) * (window.innerWidth - 400)}px` 
             }}>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimelineTab