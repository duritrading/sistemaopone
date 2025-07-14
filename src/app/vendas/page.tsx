// src/app/vendas/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import NewOpportunityModal from '@/components/modals/NewOpportunityModal'
import OpportunityDetailsModal from '@/components/modals/OpportunityDetailsModal'
import EditOpportunityModal from '@/components/modals/EditOpportunityModal'
import ConfirmationModal from '@/components/modals/ConfirmationModal'
import SalesAutomationModal from '@/components/modals/SalesAutomationModal'
import { supabase } from '@/lib/supabase'
import { SalesOpportunity, SalesStage, SalesPipelineStats } from '@/types/sales'
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Target,
  Users,
  User,
  Calendar,
  Building,
  Edit2,
  Trash2,
  Eye,
  GripVertical,
  Settings
} from 'lucide-react'

const PIPELINE_STAGES: { stage: SalesStage; color: string; bgColor: string }[] = [
  { stage: 'Lead Gerado', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  { stage: 'Qualificado', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { stage: 'Diagnóstico Realizado', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
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
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [showAutomationModal, setShowAutomationModal] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<SalesOpportunity | null>(null)
  const [opportunityToDelete, setOpportunityToDelete] = useState<{ id: string; title: string } | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<SalesStage | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null)
  const [deletingOpportunity, setDeletingOpportunity] = useState<string | null>(null)
  const stageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    fetchOpportunities()
    fetchStats()
  }, [])

  // Função para obter configurações de automação
  const getAutomationSettings = () => {
    try {
      const saved = localStorage.getItem('salesAutomationSettings')
      return saved ? JSON.parse(saved) : {
        autoCreateClient: true,
        defaultRelationshipStatus: 'Ativo',
        defaultAccountHealth: 'Saudável',
        calculateMRR: true,
        mrrMonths: 12,
        createPrimaryContact: true,
        createInitialInteraction: true
      }
    } catch {
      return {
        autoCreateClient: true,
        defaultRelationshipStatus: 'Ativo',
        defaultAccountHealth: 'Saudável',
        calculateMRR: true,
        mrrMonths: 12,
        createPrimaryContact: true,
        createInitialInteraction: true
      }
    }
  }

  // Função para verificar se cliente já existe
  const checkExistingClient = async (companyName: string, cnpj: string | null) => {
    try {
      let query = supabase
        .from('clients')
        .select('id, company_name')
        .eq('is_active', true)

      if (cnpj) {
        // Buscar por CNPJ primeiro (mais preciso)
        const { data: clientByCnpj } = await query.eq('company_cnpj', cnpj).single()
        if (clientByCnpj) return clientByCnpj
      }

      // Buscar por nome da empresa (case insensitive)
      const { data: clientByName } = await query
        .ilike('company_name', companyName.trim())
        .single()
      
      return clientByName || null
    } catch (error) {
      return null // Cliente não encontrado
    }
  }

  // Função para criar cliente automaticamente
  const createClientFromOpportunity = async (opportunity: SalesOpportunity) => {
    try {
      console.log('Creating client from opportunity:', opportunity.company_name)
      
      const automationSettings = getAutomationSettings()

      // Dados do novo cliente usando as configurações
      const clientData = {
        company_name: opportunity.company_name,
        company_cnpj: opportunity.company_cnpj || null,
        relationship_status: automationSettings.defaultRelationshipStatus,
        account_health: automationSettings.defaultAccountHealth,
        total_contract_value: opportunity.estimated_value || 0,
        monthly_recurring_revenue: automationSettings.calculateMRR 
          ? Math.round((opportunity.estimated_value || 0) / automationSettings.mrrMonths)
          : 0,
        contract_start_date: new Date().toISOString().split('T')[0],
        account_manager_id: opportunity.assigned_to,
        notes: `Cliente criado automaticamente a partir da oportunidade: ${opportunity.opportunity_title}`,
        is_active: true
      }

      // Inserir cliente
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert([clientData])
        .select('id')
        .single()

      if (clientError) throw clientError

      console.log('Cliente criado:', newClient)

      // Criar contato principal (se habilitado)
      if (newClient?.id && automationSettings.createPrimaryContact) {
        const contactData = {
          client_id: newClient.id,
          full_name: opportunity.contact_name,
          email: opportunity.contact_email,
          phone: opportunity.contact_phone || null,
          contact_type: 'Primário' as const,
          is_primary: true,
          is_active: true
        }

        const { error: contactError } = await supabase
          .from('client_contacts')
          .insert([contactData])

        if (contactError) {
          console.error('Erro ao criar contato:', contactError)
        }
      }

      // Criar interação inicial (se habilitado)
      if (newClient?.id && automationSettings.createInitialInteraction) {
        const interactionData = {
          client_id: newClient.id,
          interaction_type: 'Nota' as const,
          title: 'Cliente convertido de oportunidade',
          description: `Cliente criado automaticamente quando a oportunidade "${opportunity.opportunity_title}" foi fechada como "Contrato Assinado".`,
          outcome: 'Positivo' as const,
          created_by: opportunity.assigned_to,
          interaction_date: new Date().toISOString()
        }

        const { error: interactionError } = await supabase
          .from('client_interactions')
          .insert([interactionData])

        if (interactionError) {
          console.error('Erro ao criar interação:', interactionError)
        }
      }

      return newClient
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      throw error
    }
  }

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_opportunities')
        .select(`
          *,
          team_member:team_members(id, full_name, email)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true, nullsFirst: false })
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

  const getOpportunitiesByStage = (stage: SalesStage) => {
    return opportunities
      .filter(opp => opp.stage === stage)
      .sort((a, b) => {
        const orderA = (a as any).display_order ?? 999999
        const orderB = (b as any).display_order ?? 999999
        if (orderA !== orderB) return orderA - orderB
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }

  const updateDisplayOrder = async (opportunities: SalesOpportunity[]) => {
    try {
      for (let i = 0; i < opportunities.length; i++) {
        await supabase
          .from('sales_opportunities')
          .update({ display_order: i })
          .eq('id', opportunities[i].id)
      }
    } catch (error) {
      console.warn('Não foi possível atualizar ordem:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, opportunityId: string) => {
    console.log('Drag Start:', opportunityId)
    setDraggedItem(opportunityId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', opportunityId)
  }

  const handleDragEnd = () => {
    console.log('Drag End')
    setDraggedItem(null)
    setDragOverStage(null)
    setDragOverPosition(null)
  }

  const handleDragOver = (e: React.DragEvent, stage: SalesStage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stage)

    // Calcular posição para reordenação simples
    if (draggedItem) {
      const draggedOpp = opportunities.find(opp => opp.id === draggedItem)
      if (draggedOpp && draggedOpp.stage === stage) {
        // Reordenação dentro da mesma coluna
        const container = stageRefs.current[stage]
        if (container) {
          const rect = container.getBoundingClientRect()
          const mouseY = e.clientY - rect.top
          const cardHeight = 180 // altura estimada do card
          const position = Math.floor(mouseY / cardHeight)
          const stageOpps = getOpportunitiesByStage(stage)
          const clampedPosition = Math.max(0, Math.min(position, stageOpps.length - 1))
          setDragOverPosition(clampedPosition)
        }
      } else {
        setDragOverPosition(null)
      }
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    const currentTarget = e.currentTarget as HTMLElement
    
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverStage(null)
      setDragOverPosition(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, newStage: SalesStage) => {
    e.preventDefault()
    console.log('Drop triggered for stage:', newStage)
    
    const opportunityId = e.dataTransfer.getData('text/plain') || draggedItem
    
    if (!opportunityId) {
      setDragOverStage(null)
      setDragOverPosition(null)
      return
    }

    const opportunity = opportunities.find(opp => opp.id === opportunityId)
    
    if (!opportunity) {
      setDraggedItem(null)
      setDragOverStage(null)
      setDragOverPosition(null)
      return
    }

    const isSameStage = opportunity.stage === newStage
    const shouldReorder = isSameStage && dragOverPosition !== null

    try {
      if (shouldReorder) {
        // Reordenação dentro da mesma coluna
        console.log('Reordenando para posição:', dragOverPosition)
        
        const stageOpps = getOpportunitiesByStage(newStage)
        const currentIndex = stageOpps.findIndex(opp => opp.id === opportunityId)
        const newIndex = dragOverPosition
        
        if (currentIndex !== newIndex && currentIndex !== -1) {
          // Reordenar array
          const reorderedOpps = [...stageOpps]
          const [movedItem] = reorderedOpps.splice(currentIndex, 1)
          reorderedOpps.splice(newIndex, 0, movedItem)
          
          // Atualizar no banco
          await updateDisplayOrder(reorderedOpps)
          
          // Refresh
          await fetchOpportunities()
          await fetchStats()
        }
      } else if (!isSameStage) {
        // Mudança de stage
        console.log(`Moving "${opportunity.opportunity_title}" from "${opportunity.stage}" to "${newStage}"`)
        
        // Preparar dados de atualização
        const updateData: any = { 
          stage: newStage,
          updated_at: new Date().toISOString()
        }

        // Se movendo para "Contrato Assinado", definir data de fechamento
        if (newStage === 'Contrato Assinado') {
          updateData.actual_close_date = new Date().toISOString()
        }

        // Atualizar oportunidade
        const { error } = await supabase
          .from('sales_opportunities')
          .update(updateData)
          .eq('id', opportunityId)

        if (error) throw error

        // Criar atividade de mudança de stage
        await supabase
          .from('sales_activities')
          .insert([{
            opportunity_id: opportunityId,
            activity_type: 'Mudança de Stage',
            title: `Movido para ${newStage}`,
            description: `Oportunidade movida de "${opportunity.stage}" para "${newStage}" via drag & drop`
          }])

        // 🎯 LÓGICA PRINCIPAL: Criar cliente automaticamente se movido para "Contrato Assinado"
        if (newStage === 'Contrato Assinado') {
          const automationSettings = getAutomationSettings()
          
          if (automationSettings.autoCreateClient) {
            try {
              // Verificar se cliente já existe
              const existingClient = await checkExistingClient(
                opportunity.company_name, 
                opportunity.company_cnpj
              )

              if (existingClient) {
                console.log('Cliente já existe:', existingClient.company_name)
                alert(`✅ Oportunidade fechada!\n\nCliente "${existingClient.company_name}" já existe no sistema.`)
              } else {
                // Criar novo cliente
                const newClient = await createClientFromOpportunity(opportunity)
                console.log('Novo cliente criado:', newClient)
                
                const mrrText = automationSettings.calculateMRR 
                  ? `\n• MRR calculado: ${formatCurrency(Math.round((opportunity.estimated_value || 0) / automationSettings.mrrMonths))}`
                  : ''
                
                alert(`🎉 Oportunidade fechada com sucesso!\n\n✅ Cliente "${opportunity.company_name}" foi criado automaticamente na aba de Clientes.\n\n📋 Dados transferidos:\n• Contato principal: ${opportunity.contact_name}\n• Valor do contrato: ${formatCurrency(opportunity.estimated_value)}${mrrText}\n• Status: ${automationSettings.defaultRelationshipStatus}\n• Responsável: Mantido o mesmo da oportunidade`)
              }
            } catch (error) {
              console.error('Erro ao processar cliente:', error)
              alert(`⚠️ Oportunidade movida para "Contrato Assinado", mas houve erro ao criar cliente automaticamente.\n\nPor favor, crie o cliente manualmente na aba de Clientes.`)
            }
          } else {
            // Automação desabilitada
            alert(`✅ Oportunidade movida para "Contrato Assinado"!\n\nℹ️ A criação automática de cliente está desabilitada. Você pode criar o cliente manualmente na aba de Clientes ou ativar a automação nas configurações.`)
          }
        }

        await fetchOpportunities()
        await fetchStats()
      }
      
    // src/app/vendas/page.tsx - linha 464 corrigida
} catch (error) {
  console.error('Error moving opportunity:', error)
  alert(`Erro ao mover oportunidade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
}

    setDraggedItem(null)
    setDragOverStage(null)
    setDragOverPosition(null)
  }

  const handleViewDetails = (opportunity: SalesOpportunity) => {
    setSelectedOpportunity(opportunity)
    setShowDetailsModal(true)
  }

  const handleEditOpportunity = (opportunity: SalesOpportunity) => {
    setSelectedOpportunity(opportunity)
    setShowDetailsModal(false)
    setShowEditModal(true)
  }

  const handleEditFromCard = (e: React.MouseEvent, opportunity: SalesOpportunity) => {
    e.stopPropagation()
    setSelectedOpportunity(opportunity)
    setShowEditModal(true)
  }

  const handleDeleteOpportunity = (e: React.MouseEvent, opportunityId: string, opportunityTitle: string) => {
    e.stopPropagation()
    setOpportunityToDelete({ id: opportunityId, title: opportunityTitle })
    setShowConfirmationModal(true)
  }

  const confirmDeleteOpportunity = async () => {
    if (!opportunityToDelete) return

    setDeletingOpportunity(opportunityToDelete.id)
    
    try {
      const { error } = await supabase
        .from('sales_opportunities')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityToDelete.id)

      if (error) throw error

      setShowConfirmationModal(false)
      setOpportunityToDelete(null)
      await fetchOpportunities()
      await fetchStats()
      
    } catch (error) {
      console.error('Erro ao excluir oportunidade:', error)
      alert('Erro ao excluir oportunidade. Tente novamente.')
    } finally {
      setDeletingOpportunity(null)
    }
  }

  const cancelDeleteOpportunity = () => {
    setShowConfirmationModal(false)
    setOpportunityToDelete(null)
    setDeletingOpportunity(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <p className="text-gray-600">Gerencie suas oportunidades e acompanhe o progresso das vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewOpportunityModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Oportunidade
          </button>
          
          <button
            onClick={() => setShowAutomationModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            title="Configurar automação de vendas"
          >
            <Settings className="w-4 h-4" />
            Automação
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-500" />
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
                <p className="text-sm font-medium text-gray-500">Valor Total Pipeline</p>
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
                        {dragOverPosition !== null ? 
                          `Inserir na posição ${dragOverPosition + 1}` : 'Solte aqui para mover'}
                      </p>
                    )}
                  </div>

                  <div
  ref={(el) => {
    if (stageRefs.current) {
      stageRefs.current[stage] = el
    }
  }}
  className="space-y-3 min-h-[400px]"
>
  {stageOpportunities.map((opportunity, index) => (
    <div key={opportunity.id}>
      {dragOverStage === stage && dragOverPosition === index && draggedItem !== opportunity.id && (
        <div className="h-1 bg-blue-400 rounded-full mb-3 animate-pulse"></div>
      )}
                        
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, opportunity.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleViewDetails(opportunity)}
                          className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-move ${
                            draggedItem === opportunity.id ? 'opacity-50 scale-95' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {opportunity.opportunity_title}
                              </h4>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {opportunity.company_name}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={(e) => handleEditFromCard(e, opportunity)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-3 h-3 text-gray-500" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteOpportunity(e, opportunity.id, opportunity.opportunity_title)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-3 h-3 text-gray-500" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Valor:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(opportunity.estimated_value)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Probabilidade:</span>
                              <span className="font-medium">{opportunity.probability_percentage}%</span>
                            </div>

                            {opportunity.expected_close_date && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Previsão:</span>
                                <span className="font-medium">{formatDate(opportunity.expected_close_date)}</span>
                              </div>
                            )}

                            {opportunity.team_member && (
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                                <User className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-600">{opportunity.team_member.full_name}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                              <span className="text-xs text-gray-500">
                                {opportunity.contact_name}
                              </span>
                              <div className="flex items-center gap-1">
                                <GripVertical className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                          </div>
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

      {/* Modals */}
      {showNewOpportunityModal && (
        <NewOpportunityModal
          isOpen={showNewOpportunityModal}
          onClose={() => setShowNewOpportunityModal(false)}
          onSuccess={() => {
            fetchOpportunities()
            fetchStats()
          }}
        />
      )}

   {showDetailsModal && selectedOpportunity && (
  <OpportunityDetailsModal
    isOpen={showDetailsModal}
    opportunity={selectedOpportunity as SalesOpportunity}
    onClose={() => {
      setShowDetailsModal(false)
      setSelectedOpportunity(null)
    }}
    onEdit={() => {
      if (selectedOpportunity) {
        handleEditOpportunity(selectedOpportunity)
      }
    }}
    onSuccess={() => {
      fetchOpportunities()
      fetchStats()
    }}
  />
)}

{showEditModal && selectedOpportunity && (
  <EditOpportunityModal
    isOpen={showEditModal}
    opportunity={selectedOpportunity}
    onClose={() => {
      setShowEditModal(false)
      setSelectedOpportunity(null)
    }}
    onSuccess={() => {
      fetchOpportunities()
      fetchStats()
    }}
  />
)}

      {showAutomationModal && (
        <SalesAutomationModal
          isOpen={showAutomationModal}
          onClose={() => setShowAutomationModal(false)}
        />
      )}

      {showConfirmationModal && opportunityToDelete && (
        <ConfirmationModal
          isOpen={showConfirmationModal}
          title="Excluir Oportunidade"
          message={`Tem certeza que deseja excluir a oportunidade "${opportunityToDelete.title}"? Esta ação irá marcar a oportunidade como inativa e ela não aparecerá mais no pipeline.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={confirmDeleteOpportunity}
          onCancel={cancelDeleteOpportunity}
          isLoading={!!deletingOpportunity && deletingOpportunity === opportunityToDelete?.id}
          variant="danger"
        />
      )}
    </div>
  )
}