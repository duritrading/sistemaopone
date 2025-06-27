// src/components/modals/DeleteClientModal.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { Client } from '@/types/clients'

interface DeleteClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
  onClientDeleted: () => void
}

export default function DeleteClientModal({ 
  isOpen, 
  onClose, 
  client, 
  onClientDeleted 
}: DeleteClientModalProps) {
  const [loading, setLoading] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDelete = async () => {
    if (!client) return

    setLoading(true)

    try {
      console.log('Excluindo cliente:', client.id)

      // Soft delete - marcar como inativo
      const { error: deleteError } = await supabase
        .from('clients')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id)

      if (deleteError) {
        console.error('Erro ao excluir cliente:', deleteError)
        throw deleteError
      }

      // Criar interação de exclusão
      const { error: interactionError } = await supabase
        .from('client_interactions')
        .insert([{
          client_id: client.id,
          interaction_type: 'Nota',
          title: 'Cliente excluído',
          description: `Cliente ${client.company_name} foi removido do sistema`,
          outcome: 'Neutro',
          created_by: client.account_manager_id,
          interaction_date: new Date().toISOString()
        }])

      if (interactionError) {
        console.error('Erro ao criar interação:', interactionError)
        // Não interromper o fluxo se falhar criar a interação
      }

      console.log('Cliente excluído com sucesso')
      alert('Cliente excluído com sucesso!')
      onClientDeleted()
      onClose()
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error)
      
      let errorMessage = 'Erro ao excluir cliente. Tente novamente.'
      
      if (error?.message) {
        if (error.message.includes('foreign key')) {
          errorMessage = 'Não é possível excluir este cliente pois ele possui relacionamentos ativos.'
        } else if (error.message.includes('permission')) {
          errorMessage = 'Você não tem permissão para excluir este cliente.'
        }
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Excluir Cliente</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Tem certeza que deseja excluir o cliente{' '}
              <span className="font-semibold text-gray-900">"{client.company_name}"</span>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">Esta ação não pode ser desfeita!</p>
                  <ul className="list-disc list-inside space-y-1 text-red-600">
                    <li>O cliente será removido da listagem</li>
                    <li>Histórico de interações será preservado</li>
                    <li>Dados não serão deletados permanentemente</li>
                    {client.total_contract_value > 0 && (
                      <li>Contratos e valores comerciais serão mantidos para auditoria</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Resumo do Cliente:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium">{client.company_name}</span>
              </div>
              {client.industry && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Setor:</span>
                  <span className="font-medium">{client.industry}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{client.relationship_status}</span>
              </div>
              {client.total_contract_value > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Contrato:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(client.total_contract_value)}
                  </span>
                </div>
              )}
              {client.account_manager && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Responsável:</span>
                  <span className="font-medium">{client.account_manager.full_name}</span>
                </div>
              )}
            </div>
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
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Excluir Cliente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}