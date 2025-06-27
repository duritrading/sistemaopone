// src/components/modals/EditOpportunityModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { SalesOpportunity, SalesStage } from '@/types/sales'
import { 
  X, 
  Building, 
  User, 
  Mail, 
  Phone, 
  Target, 
  DollarSign, 
  Calendar,
  TrendingUp,
  Briefcase
} from 'lucide-react'

// Schema de validação
const editOpportunitySchema = z.object({
  company_name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  company_cnpj: z.string().min(11, 'CNPJ deve ter pelo menos 11 caracteres').optional().or(z.literal('')),
  contact_name: z.string().min(2, 'Nome do contato deve ter pelo menos 2 caracteres'),
  contact_email: z.string().email('Email inválido'),
  contact_phone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres'),
  opportunity_title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  estimated_value: z.number().min(1, 'Valor deve ser maior que zero'),
  probability_percentage: z.number().min(0).max(100),
  stage: z.enum(['Lead Qualificado', 'Proposta Enviada', 'Negociação', 'Proposta Aceita', 'Contrato Assinado', 'Perdido']),
  expected_close_date: z.string().min(1, 'Data de fechamento é obrigatória'),
  lead_source: z.string().min(2, 'Origem do lead é obrigatória'),
  assigned_to: z.string().min(1, 'Responsável é obrigatório')
})

type EditOpportunityForm = z.infer<typeof editOpportunitySchema>

interface EditOpportunityModalProps {
  isOpen: boolean
  opportunity: SalesOpportunity | null
  onClose: () => void
  onSuccess: () => void
}

const stageOptions: { value: SalesStage; label: string }[] = [
  { value: 'Lead Qualificado', label: 'Lead Qualificado' },
  { value: 'Proposta Enviada', label: 'Proposta Enviada' },
  { value: 'Negociação', label: 'Negociação' },
  { value: 'Proposta Aceita', label: 'Proposta Aceita' },
  { value: 'Contrato Assinado', label: 'Contrato Assinado' },
  { value: 'Perdido', label: 'Perdido' }
]

const leadSourceOptions = [
  'Website',
  'LinkedIn',
  'Cold Email',
  'Indicação',
  'Referral',
  'Social Media',
  'Evento',
  'Telefone',
  'Parceiro',
  'Outro'
]

interface TeamMember {
  id: string
  full_name: string
  email: string
}

export default function EditOpportunityModal({ isOpen, opportunity, onClose, onSuccess }: EditOpportunityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<EditOpportunityForm>({
    resolver: zodResolver(editOpportunitySchema)
  })

  // Buscar membros da equipe
  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers()
    }
  }, [isOpen])

  // Preencher formulário com dados da oportunidade
  useEffect(() => {
    if (opportunity && isOpen) {
      setValue('company_name', opportunity.company_name)
      setValue('company_cnpj', opportunity.company_cnpj || '')
      setValue('contact_name', opportunity.contact_name)
      setValue('contact_email', opportunity.contact_email)
      setValue('contact_phone', opportunity.contact_phone || '')
      setValue('opportunity_title', opportunity.opportunity_title)
      setValue('description', opportunity.description || '')
      setValue('estimated_value', opportunity.estimated_value)
      setValue('probability_percentage', opportunity.probability_percentage)
      setValue('stage', opportunity.stage)
      setValue('expected_close_date', opportunity.expected_close_date || '')
      setValue('lead_source', opportunity.lead_source || '')
      setValue('assigned_to', opportunity.assigned_to || '')
    }
  }, [opportunity, isOpen, setValue])

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Erro ao buscar membros da equipe:', error)
    }
  }

  // Função para formatar CNPJ
  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length <= 14) {
      return cleanValue
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const onSubmit = async (data: EditOpportunityForm) => {
    if (!opportunity) return
    
    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('sales_opportunities')
        .update({
          company_name: data.company_name,
          company_cnpj: data.company_cnpj || null,
          contact_name: data.contact_name,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          opportunity_title: data.opportunity_title,
          description: data.description,
          estimated_value: data.estimated_value,
          probability_percentage: data.probability_percentage,
          stage: data.stage,
          expected_close_date: data.expected_close_date,
          lead_source: data.lead_source,
          assigned_to: data.assigned_to,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunity.id)

      if (error) throw error

      // Adicionar atividade de edição
      await supabase
        .from('sales_activities')
        .insert([{
          opportunity_id: opportunity.id,
          activity_type: 'Nota',
          title: 'Oportunidade editada',
          description: 'Informações da oportunidade foram atualizadas'
        }])

      onClose()
      onSuccess()
      
    } catch (error) {
      console.error('Erro ao atualizar oportunidade:', error)
      alert('Erro ao atualizar oportunidade. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen || !opportunity) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Editar Oportunidade</h3>
              <p className="text-sm text-gray-600 mt-1">{opportunity.opportunity_title}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-8">
              
              {/* Informações da Empresa */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Informações da Empresa
                </h4>
                <div className="space-y-4">
                  {/* Nome da Empresa e CNPJ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome da Empresa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Empresa
                      </label>
                      <input
                        type="text"
                        {...register('company_name')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: TechCorp Ltda"
                      />
                      {errors.company_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                      )}
                    </div>

                    {/* CNPJ */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CNPJ (opcional)
                      </label>
                      <input
                        type="text"
                        {...register('company_cnpj')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        onChange={(e) => {
                          const formatted = formatCNPJ(e.target.value)
                          e.target.value = formatted
                        }}
                      />
                      {errors.company_cnpj && (
                        <p className="mt-1 text-sm text-red-600">{errors.company_cnpj.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Dados de Contato */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome do Contato */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User className="h-4 w-4 inline mr-1" />
                        Nome do Contato
                      </label>
                      <input
                        type="text"
                        {...register('contact_name')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: João Silva"
                      />
                      {errors.contact_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.contact_name.message}</p>
                      )}
                    </div>

                    {/* Email do Contato */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Email do Contato
                      </label>
                      <input
                        type="email"
                        {...register('contact_email')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="joao@techcorp.com"
                      />
                      {errors.contact_email && (
                        <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      {...register('contact_phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+55 11 99999-9999"
                    />
                    {errors.contact_phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.contact_phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Detalhes da Oportunidade */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Detalhes da Oportunidade
                </h4>
                <div className="space-y-4">
                  {/* Título da Oportunidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título da Oportunidade
                    </label>
                    <input
                      type="text"
                      {...register('opportunity_title')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Implementação de ChatBot IA"
                    />
                    {errors.opportunity_title && (
                      <p className="mt-1 text-sm text-red-600">{errors.opportunity_title.message}</p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição do Projeto
                    </label>
                    <textarea
                      rows={3}
                      {...register('description')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descreva os detalhes do projeto, requisitos e escopo..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Valor e Probabilidade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        Valor Estimado (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        {...register('estimated_value', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="150000.00"
                      />
                      {errors.estimated_value && (
                        <p className="mt-1 text-sm text-red-600">{errors.estimated_value.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <TrendingUp className="h-4 w-4 inline mr-1" />
                        Probabilidade (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        {...register('probability_percentage', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="50"
                      />
                      {errors.probability_percentage && (
                        <p className="mt-1 text-sm text-red-600">{errors.probability_percentage.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage e Informações Adicionais */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Pipeline e Responsável
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Stage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stage do Pipeline
                    </label>
                    <select
                      {...register('stage')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {stageOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.stage && (
                      <p className="mt-1 text-sm text-red-600">{errors.stage.message}</p>
                    )}
                  </div>

                  {/* Data de Fechamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Data Prevista
                    </label>
                    <input
                      type="date"
                      {...register('expected_close_date')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.expected_close_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.expected_close_date.message}</p>
                    )}
                  </div>

                  {/* Origem do Lead */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Origem do Lead
                    </label>
                    <select
                      {...register('lead_source')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione...</option>
                      {leadSourceOptions.map(source => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                    {errors.lead_source && (
                      <p className="mt-1 text-sm text-red-600">{errors.lead_source.message}</p>
                    )}
                  </div>

                  {/* Responsável */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Responsável
                    </label>
                    <select
                      {...register('assigned_to')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione...</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.full_name}
                        </option>
                      ))}
                    </select>
                    {errors.assigned_to && (
                      <p className="mt-1 text-sm text-red-600">{errors.assigned_to.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}