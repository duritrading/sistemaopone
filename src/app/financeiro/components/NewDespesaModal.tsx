// src/app/financeiro/components/NewDespesaModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, DollarSign, HelpCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const despesaSchema = z.object({
  supplier_id: z.string().min(1, 'Fornecedor é obrigatório'),
  transaction_date: z.string().min(1, 'Data de competência é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  cost_center: z.string().optional(),
  reference_code: z.string().optional(),
  repeat_transaction: z.boolean().default(false),
  installment_type: z.enum(['vista', 'parcelado']).default('vista'),
  due_date: z.string().min(1, 'Vencimento é obrigatório'),
  payment_method: z.string().min(1, 'Forma de pagamento é obrigatória'),
  account_id: z.string().min(1, 'Conta de pagamento é obrigatória'),
  is_paid: z.boolean().default(false),
  is_scheduled: z.boolean().default(false),
  notes: z.string().optional()
})

type DespesaFormData = z.infer<typeof despesaSchema>

interface NewDespesaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Supplier {
  id: string
  name: string
}

interface Account {
  id: string
  name: string
  type: string
}

export default function NewDespesaModal({
  isOpen,
  onClose,
  onSuccess
}: NewDespesaModalProps) {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeTab, setActiveTab] = useState<'observacoes' | 'anexo'>('observacoes')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      installment_type: 'vista',
      repeat_transaction: false,
      is_paid: false,
      is_scheduled: false
    }
  })

  const repeatTransaction = watch('repeat_transaction')

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers()
      fetchAccounts()
    }
  }, [isOpen])

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (err) {
      console.error('Erro ao buscar fornecedores:', err)
    }
  }

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, type')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAccounts(data || [])
    } catch (err) {
      console.error('Erro ao buscar contas:', err)
    }
  }

  const onSubmit = async (data: DespesaFormData) => {
    try {
      setLoading(true)

      const transactionData = {
        description: data.description,
        category: data.category,
        type: 'despesa',
        amount: data.amount,
        status: data.is_paid ? 'pago' : 'pendente',
        transaction_date: data.transaction_date,
        due_date: data.due_date,
        payment_date: data.is_paid ? new Date().toISOString() : null,
        account_id: data.account_id,
        company: suppliers.find(s => s.id === data.supplier_id)?.name,
        notes: data.notes,
        payment_method: data.payment_method,
        cost_center: data.cost_center,
        reference_code: data.reference_code,
        is_scheduled: data.is_scheduled
      }

      const { error } = await supabase
        .from('financial_transactions')
        .insert([transactionData])

      if (error) throw error

      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Erro ao criar despesa:', err)
      alert('Erro ao criar despesa: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Nova despesa</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Informações do lançamento */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-700">Informações do lançamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Fornecedor */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor
                </label>
                <select
                  {...register('supplier_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione o fornecedor</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplier_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.supplier_id.message}</p>
                )}
              </div>

              {/* Data de competência */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de competência *
                </label>
                <input
                  type="date"
                  {...register('transaction_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                />
                {errors.transaction_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.transaction_date.message}</p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  {...register('description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  placeholder="Descrição da despesa"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                  <HelpCircle className="w-4 h-4 text-gray-400 inline ml-1" />
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione a categoria</option>
                  <option value="despesas_operacionais">Despesas Operacionais</option>
                  <option value="despesas_administrativas">Despesas Administrativas</option>
                  <option value="despesas_vendas">Despesas de Vendas</option>
                  <option value="despesas_financeiras">Despesas Financeiras</option>
                  <option value="outras_despesas">Outras Despesas</option>
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              {/* Centro de custo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Centro de custo
                  <HelpCircle className="w-4 h-4 text-gray-400 inline ml-1" />
                </label>
                <select
                  {...register('cost_center')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione o centro de custo</option>
                  <option value="vendas">Vendas</option>
                  <option value="marketing">Marketing</option>
                  <option value="administrativo">Administrativo</option>
                  <option value="operacional">Operacional</option>
                </select>
              </div>

              {/* Código de referência */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de referência
                  <HelpCircle className="w-4 h-4 text-gray-400 inline ml-1" />
                </label>
                <input
                  type="text"
                  {...register('reference_code')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  placeholder="Código de referência"
                />
              </div>
            </div>

            {/* Repetir lançamento */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('repeat_transaction')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">Repetir lançamento?</label>
              {repeatTransaction && (
                <button
                  type="button"
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Condição de pagamento */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-700">Condição de pagamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Parcelamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parcelamento *
                </label>
                <select
                  {...register('installment_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                >
                  <option value="vista">À vista</option>
                  <option value="parcelado">Parcelado</option>
                </select>
              </div>

              {/* Vencimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vencimento *
                </label>
                <input
                  type="date"
                  {...register('due_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                />
                {errors.due_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>
                )}
              </div>

              {/* Forma de pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de pagamento
                </label>
                <select
                  {...register('payment_method')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  <option value="pix">PIX</option>
                  <option value="ted">TED</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
                {errors.payment_method && (
                  <p className="text-red-500 text-sm mt-1">{errors.payment_method.message}</p>
                )}
              </div>

              {/* Conta de pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta de pagamento
                </label>
                <select
                  {...register('account_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione a conta</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.type}
                    </option>
                  ))}
                </select>
                {errors.account_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.account_id.message}</p>
                )}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('is_paid')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Pago
                  <HelpCircle className="w-4 h-4 text-gray-400 inline ml-1" />
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('is_scheduled')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Agendado
                  <HelpCircle className="w-4 h-4 text-gray-400 inline ml-1" />
                </label>
              </div>
            </div>
          </div>

          {/* Observações/Anexo */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('observacoes')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'observacoes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Observações
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('anexo')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'anexo'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Anexo
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'observacoes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  {...register('notes')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  placeholder="Descreva observações relevantes sobre esse lançamento financeiro"
                />
              </div>
            )}

            {activeTab === 'anexo' && (
              <div className="text-center py-8 text-gray-500">
                <p>Funcionalidade de anexo será implementada em breve</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}