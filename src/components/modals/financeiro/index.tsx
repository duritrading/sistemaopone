// src/components/modals/financeiro/index.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, Building2, User, Calendar, FileText, CreditCard } from 'lucide-react'
import {
  Transaction,
  Account,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionType,
  TransactionCategory,
  TRANSACTION_CATEGORIES,
  ACCOUNT_TYPES
} from '@/types/financeiro'

// === MODAL NOVA TRANSAÇÃO ===
interface NewTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: CreateTransactionRequest) => Promise<void>
  accounts: Account[]
  projects?: { id: string; name: string }[]
  clients?: { id: string; company_name: string }[]
}

export const NewTransactionModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  accounts,
  projects = [],
  clients = []
}: NewTransactionModalProps) => {
  const [formData, setFormData] = useState<CreateTransactionRequest>({
    description: '',
    category: 'receitas_servicos',
    type: 'receita',
    amount: 0,
    account_id: '',
    due_date: '',
    company: '',
    project_id: '',
    client_id: '',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      description: '',
      category: 'receitas_servicos',
      type: 'receita',
      amount: 0,
      account_id: '',
      due_date: '',
      company: '',
      project_id: '',
      client_id: '',
      notes: ''
    })
  }

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      alert('Descrição é obrigatória')
      return
    }

    if (!formData.amount || formData.amount <= 0) {
      alert('Valor deve ser maior que zero')
      return
    }

    if (!formData.account_id) {
      alert('Conta é obrigatória')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      resetForm()
      onClose()
    } catch (error) {
      console.error('Erro ao criar transação:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: type === 'receita' ? 'receitas_servicos' : 'despesas_operacionais'
    }))
  }

  const getFilteredCategories = () => {
    return Object.entries(TRANSACTION_CATEGORIES).filter(([key]) => 
      formData.type === 'receita' ? key.startsWith('receitas_') : key.startsWith('despesas_')
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Nova Transação</h2>
              <p className="text-sm text-gray-500">Registre uma nova receita ou despesa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('receita')}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  formData.type === 'receita'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Receita</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Dinheiro que entra</p>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('despesa')}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  formData.type === 'despesa'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium">Despesa</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Dinheiro que sai</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Pagamento do projeto XYZ"
                disabled={isSubmitting}
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TransactionCategory }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                {getFilteredCategories().map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
                disabled={isSubmitting}
              />
            </div>

            {/* Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta *
              </label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="">Selecione uma conta</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({ACCOUNT_TYPES[account.type]})
                  </option>
                ))}
              </select>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'receita' ? 'Data de Recebimento' : 'Data de Vencimento'}
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            {/* Empresa */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa/Fornecedor
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome da empresa"
                disabled={isSubmitting}
              />
            </div>

            {/* Projeto */}
            {projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projeto
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="">Selecione um projeto</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Cliente */}
            {clients.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.company_name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Informações adicionais..."
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Criando...' : 'Criar Transação'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// === MODAL EDITAR TRANSAÇÃO ===
interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: UpdateTransactionRequest) => Promise<void>
  transaction: Transaction | null
  accounts: Account[]
  projects?: { id: string; name: string }[]
  clients?: { id: string; company_name: string }[]
}

export const EditTransactionModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  transaction,
  accounts,
  projects = [],
  clients = []
}: EditTransactionModalProps) => {
  const [formData, setFormData] = useState<UpdateTransactionRequest>({
    id: '',
    description: '',
    category: 'receitas_servicos',
    amount: 0,
    account_id: '',
    due_date: '',
    company: '',
    project_id: '',
    client_id: '',
    notes: '',
    status: 'pendente'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (transaction && isOpen) {
      setFormData({
        id: transaction.id,
        description: transaction.description,
        category: transaction.category,
        amount: transaction.amount,
        account_id: transaction.account_id,
        due_date: transaction.due_date || '',
        company: transaction.company || '',
        project_id: transaction.project_id || '',
        client_id: transaction.client_id || '',
        notes: transaction.notes || '',
        status: transaction.status
      })
    }
  }, [transaction, isOpen])

  const handleSubmit = async () => {
    if (!formData.description?.trim()) {
      alert('Descrição é obrigatória')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !transaction) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              transaction.type === 'receita' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`w-5 h-5 ${
                transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Editar Transação</h2>
              <p className="text-sm text-gray-500">#{transaction.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="pendente">Pendente</option>
                <option value={transaction.type === 'receita' ? 'recebido' : 'pago'}>
                  {transaction.type === 'receita' ? 'Recebido' : 'Pago'}
                </option>
                <option value="vencido">Vencido</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            {/* Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta *
              </label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({ACCOUNT_TYPES[account.type]})
                  </option>
                ))}
              </select>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {transaction.type === 'receita' ? 'Data de Recebimento' : 'Data de Vencimento'}
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}