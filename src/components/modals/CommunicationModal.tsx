// src/components/modals/CommunicationModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { X, MessageSquare, Users, Mail, Phone, Video, Calendar } from 'lucide-react'

// Schema de validação
const communicationSchema = z.object({
  type: z.enum(['Reunião', 'Email', 'Ligação', 'Decisão', 'Escalação', 'Nota']),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  participants: z.string().optional(),
  follow_up_actions: z.string().optional(),
  sentiment: z.enum(['Positivo', 'Neutro', 'Negativo']).optional()
})

type CommunicationForm = z.infer<typeof communicationSchema>

interface CommunicationModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  communication?: any
  onSuccess: () => void
}

const communicationTypes = [
  { value: 'Reunião', label: 'Reunião', icon: Users },
  { value: 'Email', label: 'Email', icon: Mail },
  { value: 'Ligação', label: 'Ligação', icon: Phone },
  { value: 'Decisão', label: 'Decisão', icon: MessageSquare },
  { value: 'Escalação', label: 'Escalação', icon: Video },
  { value: 'Nota', label: 'Nota', icon: MessageSquare }
]

export default function CommunicationModal({
  isOpen,
  onClose,
  projectId,
  communication,
  onSuccess
}: CommunicationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!communication

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<CommunicationForm>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      type: 'Nota',
      sentiment: 'Neutro'
    }
  })

  // Preencher form quando editando
  useEffect(() => {
    if (isOpen && communication) {
      setValue('type', communication.type)
      setValue('title', communication.title)
      setValue('content', communication.content || '')
      setValue('participants', communication.participants?.join(', ') || '')
      setValue('follow_up_actions', communication.follow_up_actions?.join('\n') || '')
      setValue('sentiment', communication.sentiment || 'Neutro')
    } else if (isOpen && !communication) {
      reset({
        type: 'Nota',
        sentiment: 'Neutro'
      })
    }
  }, [isOpen, communication, setValue, reset])

  const onSubmit = async (data: CommunicationForm) => {
    setIsSubmitting(true)
    
    try {
      const participantsArray = data.participants 
        ? data.participants.split(',').map(p => p.trim()).filter(p => p)
        : []
      
      const followUpActions = data.follow_up_actions
        ? data.follow_up_actions.split('\n').map(a => a.trim()).filter(a => a)
        : []

      const communicationData = {
        project_id: projectId,
        type: data.type,
        title: data.title,
        content: data.content,
        participants: participantsArray,
        follow_up_actions: followUpActions,
        sentiment: data.sentiment,
        created_at: new Date().toISOString()
      }

      if (isEditing) {
        const { error } = await supabase
          .from('project_communications')
          .update({
            ...communicationData,
            updated_at: new Date().toISOString()
          })
          .eq('id', communication.id)

        if (error) throw error
        alert('Comunicação atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('project_communications')
          .insert([communicationData])

        if (error) throw error
        alert('Comunicação registrada com sucesso!')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar comunicação:', error)
      alert('Falha ao salvar comunicação: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <header className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Comunicação' : 'Nova Comunicação'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">
            {/* Tipo de Comunicação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Comunicação
              </label>
              <select
                {...register('type')}
                className={`w-full px-3 py-2 border ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900`}
              >
                {communicationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="Ex: Reunião de alinhamento com cliente"
                className={`w-full px-3 py-2 border ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Participantes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participantes (separados por vírgula)
              </label>
              <input
                {...register('participants')}
                type="text"
                placeholder="Ex: João Silva, Maria Santos, Cliente XYZ"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              />
            </div>

            {/* Conteúdo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resumo do Conteúdo
              </label>
              <textarea
                {...register('content')}
                rows={4}
                placeholder="Descreva o que foi discutido, decidido ou comunicado..."
                className={`w-full px-3 py-2 border ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900`}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>

            {/* Ações de Follow-up */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ações de Follow-up (uma por linha)
              </label>
              <textarea
                {...register('follow_up_actions')}
                rows={3}
                placeholder="Ex:&#10;- Enviar proposta até sexta&#10;- Agendar próxima reunião&#10;- Validar requisitos com equipe técnica"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              />
            </div>

            {/* Sentimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentimento da Comunicação
              </label>
              <select
                {...register('sentiment')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              >
                <option value="Positivo">Positivo</option>
                <option value="Neutro">Neutro</option>
                <option value="Negativo">Negativo</option>
              </select>
            </div>
          </div>

          <footer className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 text-gray-700 transition-colors"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}