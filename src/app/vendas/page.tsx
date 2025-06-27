// src/app/vendas/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
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
  Eye
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
                  <div key={stage} className="flex-shrink-0 w-80">
                    {/* Stage Header */}
                    <div className={`${bgColor} rounded-lg p-4 mb-4`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${color}`}>{stage}</h3>
                        <span className={`text-sm font-semibold ${color} bg-white px-2 py-1 rounded`}>
                          {stageOpportunities.length}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCurrency(stageValue)}
                      </p>
                    </div>

                    {/* Opportunities */}
                    <div className="space-y-3 min-h-[400px]">
                      {stageOpportunities.map((opportunity) => (
                        <div
                          key={opportunity.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          {/* Opportunity Header */}
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-gray-900 text-sm leading-tight">
                              {opportunity.opportunity_title}
                            </h4>
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

                          {/* Stage Actions */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <select
                              value={opportunity.stage}
                              onChange={(e) => handleStageChange(opportunity.id, e.target.value as SalesStage)}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {PIPELINE_STAGES.map(({ stage }) => (
                                <option key={stage} value={stage}>
                                  {stage}
                                </option>
                              ))}
                            </select>
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
    </DashboardLayout>
  )
}