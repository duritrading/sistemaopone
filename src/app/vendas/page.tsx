// src/app/vendas/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import NewOpportunityModal from '@/components/modals/NewOpportunityModal'
import { supabase } from '@/lib/supabase'
import { SalesOpportunity, SalesStage, SalesPipelineStats } from '@/types/sales'
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Target,
  Users,
  Calendar,
  Phone,
  Mail,
  Building,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  GripVertical
} from 'lucide-react'

const PIPELINE_STAGES: { stage: SalesStage; color: string; bgColor: string }[] = [
  { stage: 'Lead Qualificado', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { stage: 'Proposta Enviada', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { stage: 'Negociação', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { stage: 'Proposta Aceita', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { stage: 'Contrato Assinado', color: 'text-green-600', bgColor: 'bg-green-50' },
  { stage: 'Perdido', color: 'text-red-600', bgColor: 'bg-red-50' }
]

export default function VendasPage() {
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SalesPipelineStats | null>(null)
  const [showNewOpportunityModal, setShowNewOpportunityModal] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<SalesStage | null>(null)

  useEffect(() => {
    fetchOpportunities()
    fetchStats()
  }, [])

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_opportunities')
        .select(`
          *,
          team_member:team_members(id, full_name, email)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOpportunities(data || [])
    } catch (error) {
      console.error('Erro ao buscar oportunidades:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_opportunities')
        .select('stage, estimated_value, probability_percentage')
        .eq('is_active', true)

      if (error) throw error

      const opportunities = data || []
      const totalOpportunities = opportunities.length
      const totalValue = opportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0)
      const avgDealSize = totalOpportunities > 0 ? totalValue / totalOpportunities : 0
      
      const wonDeals = opportunities.filter(opp => opp.stage === 'Contrato Assinado').length
      const conversionRate = totalOpportunities > 0 ? (wonDeals / totalOpportunities) * 100 : 0

      const byStage = PIPELINE_STAGES.map(({ stage }) => {
        const stageOpps = opportunities.filter(opp => opp.stage === stage)
        return {
          stage,
          count: stageOpps.length,
          total_value: stageOpps.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0),
          avg_probability: stageOpps.length > 0 
            ? stageOpps.reduce((sum, opp) => sum + opp.probability_percentage, 0) / stageOpps.length 
            : 0
        }
      })

      setStats({
        total_opportunities: totalOpportunities,
        total_value: totalValue,
        avg_deal_size: avgDealSize,
        conversion_rate: conversionRate,
        by_stage: byStage
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStageConfig = (stage: SalesStage) => {
    return PIPELINE_STAGES.find(s => s.stage === stage) || PIPELINE_STAGES[0]
  }

  const getOpportunitiesByStage = (stage: SalesStage) => {
    return opportunities.filter(opp => opp.stage === stage)
  }

  const handleStageChange = async (opportunityId: string, newStage: SalesStage) => {
    try {
      const { error } = await supabase
        .from('sales_opportunities')
        .update({ 
          stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId)

      if (error) throw error

      // Refresh data
      await fetchOpportunities()
      await fetchStats()
    } catch (error) {
      console.error('Erro ao atualizar stage:', error)
      alert('Erro ao atualizar stage. Tente novamente.')
    }
  }

  // Drag & Drop Functions
  const handleDragStart = (e: React.DragEvent, opportunityId: string) => {
    setDraggedItem(opportunityId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', opportunityId)
    
    // Add visual feedback to dragged item
    setTimeout(() => {
      const draggedElement = e.target as HTMLElement
      draggedElement.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null)
    setDragOverStage(null)
    
    // Remove visual feedback
    const draggedElement = e.target as HTMLElement
    draggedElement.style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, stage: SalesStage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stage)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire drop zone
    const relatedTarget = e.relatedTarget as HTMLElement
    const currentTarget = e.currentTarget as HTMLElement
    
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverStage(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, newStage: SalesStage) => {
    e.preventDefault()
    setDragOverStage(null)
    
    const opportunityId = e.dataTransfer.getData('text/html')
    if (!opportunityId || !draggedItem) return

    // Find the opportunity being moved
    const opportunity = opportunities.find(opp => opp.id === opportunityId)
    if (!opportunity || opportunity.stage === newStage) {
      setDraggedItem(null)
      return
    }

    // Optimistic update - update local state immediately
    setOpportunities(prev => 
      prev.map(opp => 
        opp.id === opportunityId 
          ? { ...opp, stage: newStage }
          : opp
      )
    )

    // Update database
    try {
      const { error } = await supabase
        .from('sales_opportunities')
        .update({ 
          stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId)

      if (error) throw error

      // Add activity log
      await supabase
        .from('sales_activities')
        .insert([{
          opportunity_id: opportunityId,
          activity_type: 'Mudança de Stage',
          title: `Movido para ${newStage}`,
          description: `Oportunidade movida de "${opportunity.stage}" para "${newStage}" via drag & drop`,
          created_by: null // We could get current user here
        }])

      // Refresh stats
      await fetchStats()
      
    } catch (error) {
      console.error('Erro ao mover oportunidade:', error)
      // Revert optimistic update on error
      setOpportunities(prev => 
        prev.map(opp => 
          opp.id === opportunityId 
            ? { ...opp, stage: opportunity.stage }
            : opp
        )
      )
      alert('Erro ao mover oportunidade. Tente novamente.')
    }

    setDraggedItem(null)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
            <p className="mt-2 text-gray-700">
              Gerencie suas oportunidades e acompanhe o progresso das vendas
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setShowNewOpportunityModal(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Oportunidade
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Oportunidades</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_opportunities}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_value)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ticket Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avg_deal_size)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.conversion_rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pipeline de Vendas</h2>
          
          <div className="overflow-x-auto">
            <div className="flex space-x-6 min-w-max">
              {PIPELINE_STAGES.map(({ stage, color, bgColor }) => {
                const stageOpportunities = getOpportunitiesByStage(stage)
                const stageValue = stageOpportunities.reduce((sum, opp) => sum + opp.estimated_value, 0)
                
                return (
                  <div 
                    key={stage} 
                    className="flex-shrink-0 w-80"
                    onDragOver={(e) => handleDragOver(e, stage)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage)}
                  >
                    {/* Stage Header */}
                    <div className={`${bgColor} rounded-lg p-4 mb-4 transition-all duration-200 ${
                      dragOverStage === stage ? 'ring-2 ring-blue-400 ring-opacity-75 scale-105' : ''
                    }`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${color}`}>{stage}</h3>
                        <span className={`text-sm font-semibold ${color} bg-white px-2 py-1 rounded`}>
                          {stageOpportunities.length}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCurrency(stageValue)}
                      </p>
                      {dragOverStage === stage && (
                        <p className="text-xs text-blue-600 mt-2 font-medium">
                          Solte aqui para mover
                        </p>
                      )}
                    </div>

                    {/* Opportunities */}
                    <div className="space-y-3 min-h-[400px]">
                      {stageOpportunities.map((opportunity) => (
                        <div
                          key={opportunity.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, opportunity.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-move ${
                            draggedItem === opportunity.id ? 'opacity-50 scale-95' : 'hover:scale-105'
                          }`}
                        >
                          {/* Opportunity Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-2 flex-1">
                              {/* Drag Handle */}
                              <div className="flex items-center justify-center w-4 h-4 mt-1 text-gray-400 cursor-grab active:cursor-grabbing">
                                <GripVertical className="h-3 w-3" />
                              </div>
                              
                              <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1">
                                {opportunity.opportunity_title}
                              </h4>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button className="p-1 text-gray-400 hover:text-blue-500 rounded">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-blue-500 rounded">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-red-500 rounded">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Company & Contact */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <Building className="h-4 w-4 mr-2" />
                              {opportunity.company_name}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="h-4 w-4 mr-2" />
                              {opportunity.contact_name}
                            </div>
                          </div>

                          {/* Value & Probability */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-lg font-semibold text-green-600">
                              {formatCurrency(opportunity.estimated_value)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {opportunity.probability_percentage}% prob.
                            </div>
                          </div>

                          {/* Expected Close Date */}
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(opportunity.expected_close_date)}
                          </div>

                          {/* Assigned To */}
                          {opportunity.team_member && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center text-sm text-gray-600">
                                <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-xs text-white font-medium">
                                    {opportunity.team_member.full_name.charAt(0)}
                                  </span>
                                </div>
                                {opportunity.team_member.full_name}
                              </div>
                            </div>
                          )}

                          {/* Drag Instructions */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 text-center">
                              Arraste para mover entre etapas
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* New Opportunity Modal */}
      <NewOpportunityModal 
        isOpen={showNewOpportunityModal}
        onClose={() => setShowNewOpportunityModal(false)}
        onSuccess={() => {
          fetchOpportunities() // Refresh opportunities
          fetchStats() // Refresh stats
        }}
      />
    </DashboardLayout>
  )
}