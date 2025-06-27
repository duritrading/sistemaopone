// src/components/modals/EditMemberModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { X, User, Mail, Briefcase, MapPin, Activity, Percent } from 'lucide-react'

// Schema de validação
const editMemberSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  seniority_level: z.enum(['Trainee', 'Junior', 'Pleno', 'Sênior', 'Principal']),
  primary_specialization: z.enum([
    'Machine Learning/IA', 
    'Ciência de Dados', 
    'Backend', 
    'Frontend', 
    'DevOps', 
    'Produto', 
    'QA', 
    'UX/UI'
  ]),
  work_modality: z.enum(['Presencial', 'Remoto', 'Híbrido']),
  availability_status: z.enum(['Disponível', 'Parcial', 'Ocupado', 'Férias', 'Afastamento médico']),
  allocation_percentage: z.number().min(0).max(100),
  profile_photo_url: z.string().url().optional().or(z.literal(''))
})

type EditMemberForm = z.infer<typeof editMemberSchema>

type TeamMember = {
  id: string
  full_name: string
  email: string
  profile_photo_url: string | null
  seniority_level: 'Trainee' | 'Junior' | 'Pleno' | 'Sênior' | 'Principal'
  primary_specialization: 'Machine Learning/IA' | 'Ciência de Dados' | 'Backend' | 'Frontend' | 'DevOps' | 'Produto' | 'QA' | 'UX/UI'
  work_modality: 'Presencial' | 'Remoto' | 'Híbrido'
  availability_status: 'Disponível' | 'Parcial' | 'Ocupado' | 'Férias' | 'Afastamento médico'
  allocation_percentage: number
  last_access: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface EditMemberModalProps {
  isOpen: boolean
  member: TeamMember | null
  onClose: () => void
  onSuccess: () => void
}

const seniorityOptions = [
  { value: 'Trainee', label: 'Trainee' },
  { value: 'Junior', label: 'Junior' },
  { value: 'Pleno', label: 'Pleno' },
  { value: 'Sênior', label: 'Sênior' },
  { value: 'Principal', label: 'Principal' }
] as const

const specializationOptions = [
  { value: 'Machine Learning/IA', label: 'Machine Learning/IA' },
  { value: 'Ciência de Dados', label: 'Ciência de Dados' },
  { value: 'Backend', label: 'Backend' },
  { value: 'Frontend', label: 'Frontend' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Produto', label: 'Produto' },
  { value: 'QA', label: 'QA' },
  { value: 'UX/UI', label: 'UX/UI' }
] as const

const modalityOptions = [
  { value: 'Presencial', label: 'Presencial' },
  { value: 'Remoto', label: 'Remoto' },
  { value: 'Híbrido', label: 'Híbrido' }
] as const

const availabilityOptions = [
  { value: 'Disponível', label: 'Disponível' },
  { value: 'Parcial', label: 'Parcial' },
  { value: 'Ocupado', label: 'Ocupado' },
  { value: 'Férias', label: 'Férias' },
  { value: 'Afastamento médico', label: 'Afastamento médico' }
] as const

export default function EditMemberModal({ isOpen, member, onClose, onSuccess }: EditMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<EditMemberForm>({
    resolver: zodResolver(editMemberSchema)
  })

  // Populate form when member changes
  useEffect(() => {
    if (member) {
      setValue('full_name', member.full_name)
      setValue('email', member.email)
      setValue('seniority_level', member.seniority_level)
      setValue('primary_specialization', member.primary_specialization)
      setValue('work_modality', member.work_modality)
      setValue('availability_status', member.availability_status)
      setValue('allocation_percentage', member.allocation_percentage)
      setValue('profile_photo_url', member.profile_photo_url || '')
    }
  }, [member, setValue])

  const onSubmit = async (data: EditMemberForm) => {
    if (!member) return
    
    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          full_name: data.full_name,
          email: data.email,
          seniority_level: data.seniority_level,
          primary_specialization: data.primary_specialization,
          work_modality: data.work_modality,
          availability_status: data.availability_status,
          allocation_percentage: data.allocation_percentage,
          profile_photo_url: data.profile_photo_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id)

      if (error) throw error

      onClose()
      onSuccess()
      
    } catch (error) {
      console.error('Erro ao atualizar membro:', error)
      alert('Erro ao atualizar membro. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Editar Membro - {member.full_name}</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              
              {/* Dados Pessoais */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Dados Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome Completo */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      {...register('full_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Digite o nome completo"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@opone.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Foto do Perfil */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL da Foto (opcional)
                    </label>
                    <input
                      type="url"
                      {...register('profile_photo_url')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://exemplo.com/foto.jpg"
                    />
                    {errors.profile_photo_url && (
                      <p className="mt-1 text-sm text-red-600">{errors.profile_photo_url.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Hierarquia Profissional */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Hierarquia Profissional
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Senioridade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nível de Senioridade
                    </label>
                    <select
                      {...register('seniority_level')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {seniorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.seniority_level && (
                      <p className="mt-1 text-sm text-red-600">{errors.seniority_level.message}</p>
                    )}
                  </div>

                  {/* Especialização */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Especialização Principal
                    </label>
                    <select
                      {...register('primary_specialization')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {specializationOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.primary_specialization && (
                      <p className="mt-1 text-sm text-red-600">{errors.primary_specialization.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modalidade e Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Modalidade e Disponibilidade
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Modalidade de Trabalho */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modalidade de Trabalho
                    </label>
                    <select
                      {...register('work_modality')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {modalityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.work_modality && (
                      <p className="mt-1 text-sm text-red-600">{errors.work_modality.message}</p>
                    )}
                  </div>

                  {/* Status de Disponibilidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Activity className="h-4 w-4 inline mr-1" />
                      Status
                    </label>
                    <select
                      {...register('availability_status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {availabilityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.availability_status && (
                      <p className="mt-1 text-sm text-red-600">{errors.availability_status.message}</p>
                    )}
                  </div>

                  {/* Percentual de Alocação */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Percent className="h-4 w-4 inline mr-1" />
                      Alocação (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      {...register('allocation_percentage', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                    {errors.allocation_percentage && (
                      <p className="mt-1 text-sm text-red-600">{errors.allocation_percentage.message}</p>
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