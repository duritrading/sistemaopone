// src/components/modals/NewContactModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { X, User, Mail, Phone, Briefcase } from 'lucide-react'
import { CreateContactRequest, ContactType } from '@/types/clients'

interface NewContactModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string | null
  clientName: string
  onContactCreated: () => void
}

export default function NewContactModal({ 
  isOpen, 
  onClose, 
  clientId, 
  clientName, 
  onContactCreated 
}: NewContactModalProps) {
  const [formData, setFormData] = useState<CreateContactRequest>({
    client_id: '',
    full_name: '',
    job_title: '',
    department: '',
    email: '',
    phone: '',
    mobile: '',
    contact_type: 'Profissional',
    is_primary: false
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (isOpen && clientId) {
      setFormData(prev => ({ ...prev, client_id: clientId }))
      setErrors({})
    }
  }, [isOpen, clientId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Nome é obrigatório
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório'
    }

    // Email deve ter formato válido se preenchido
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Email deve ter formato válido'
      }
    }

    // Pelo menos um meio de contato deve ser fornecido
    if (!formData.email?.trim() && !formData.phone?.trim() && !formData.mobile?.trim()) {
      newErrors.contact = 'Forneça pelo menos um meio de contato (email, telefone ou celular)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof CreateContactRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Limpar erro geral de contato
    if (errors.contact && (field === 'email' || field === 'phone' || field === 'mobile')) {
      setErrors(prev => ({ ...prev, contact: '' }))
    }
  }

  const resetForm = () => {
    setFormData({
      client_id: clientId || '',
      full_name: '',
      job_title: '',
      department: '',
      email: '',
      phone: '',
      mobile: '',
      contact_type: 'Profissional',
      is_primary: false
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !clientId) return

    setLoading(true)

    try {
      // Preparar dados limpos para inserção
      const contactData = {
        client_id: clientId,
        full_name: formData.full_name.trim(),
        job_title: formData.job_title?.trim() || null,
        department: formData.department?.trim() || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        mobile: formData.mobile?.trim() || null,
        contact_type: formData.contact_type,
        is_primary: formData.is_primary,
        is_active: true
      }

      console.log('Criando contato:', contactData)

      const { data: insertedContact, error: insertError } = await supabase
        .from('client_contacts')
        .insert([contactData])
        .select('*')
        .single()

      if (insertError) {
        console.error('Erro ao criar contato:', insertError)
        throw insertError
      }

      console.log('Contato criado:', insertedContact)

      // Se for contato primário, remover flag primary dos outros contatos
      if (formData.is_primary) {
        const { error: updateError } = await supabase
          .from('client_contacts')
          .update({ is_primary: false })
          .eq('client_id', clientId)
          .neq('id', insertedContact.id)

        if (updateError) {
          console.error('Erro ao atualizar contatos primários:', updateError)
          // Não interromper o fluxo
        }
      }

      // Criar interação de adição de contato
      const { error: interactionError } = await supabase
        .from('client_interactions')
        .insert([{
          client_id: clientId,
          contact_id: insertedContact.id,
          interaction_type: 'Nota',
          title: 'Novo contato adicionado',
          description: `Contato ${contactData.full_name} foi adicionado como ${contactData.contact_type}`,
          outcome: 'Positivo',
          interaction_date: new Date().toISOString()
        }])

      if (interactionError) {
        console.error('Erro ao criar interação:', interactionError)
        // Não interromper o fluxo
      }

      alert('Contato criado com sucesso!')
      onContactCreated()
      resetForm()
      onClose()
    } catch (error: any) {
      console.error('Erro ao criar contato:', error)
      
      let errorMessage = 'Erro ao criar contato. Tente novamente.'
      
      if (error?.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'Já existe um contato com este email.'
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Cliente não encontrado.'
        }
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !clientId) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Novo Contato</h2>
              <p className="text-sm text-gray-600">{clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Dados Pessoais */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">Dados Pessoais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.full_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Ana Silva"
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo/Função
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Gerente de TI"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Tecnologia"
                  />
                </div>
              </div>
            </div>

            {/* Informações de Contato */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">Informações de Contato</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ana.silva@empresa.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone Fixo
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 3000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Celular
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {errors.contact && (
                <p className="text-red-500 text-sm mt-2">{errors.contact}</p>
              )}
            </div>

            {/* Tipo e Configurações */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">Tipo e Configurações</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Contato
                  </label>
                  <select
                    value={formData.contact_type}
                    onChange={(e) => handleInputChange('contact_type', e.target.value as ContactType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Primário">Primário</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Executivo">Executivo</option>
                    <option value="Profissional">Profissional</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_primary}
                      onChange={(e) => handleInputChange('is_primary', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Definir como contato principal
                    </span>
                  </label>
                </div>
              </div>

              {formData.is_primary && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Contato Principal:</strong> Este contato aparecerá em destaque nos cards e será o contato padrão para comunicações com a empresa.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Criando...
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Criar Contato
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}