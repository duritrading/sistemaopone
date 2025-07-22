// src/app/financeiro/components/NewDespesaModal.tsx - CORRIGIDO
'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { 
  X, Building, DollarSign, Calendar, CreditCard, 
  User, Paperclip, Upload, FileText, Trash2,
  Info, Save, MessageCircle, AlertCircle
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const despesaSchema = z.object({
  supplier_id: z.string().optional(),
  transaction_date: z.string().min(1, 'Data da transação é obrigatória'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  cost_center: z.string().optional(),
  reference_code: z.string().optional(),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  payment_method: z.string().min(1, 'Método de pagamento é obrigatório'),
  account_id: z.string().min(1, 'Conta de pagamento é obrigatória'),
  installment_type: z.enum(['vista', 'parcelado']),
  installments: z.number().min(1).max(12).optional(),
  repeat_transaction: z.boolean(),
  repeat_frequency: z.enum(['semanal', 'mensal', 'trimestral', 'anual']).optional(),
  is_paid: z.boolean(),
  notes: z.string().optional()
})

type DespesaFormData = z.infer<typeof despesaSchema>

interface NewDespesaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: any
}

interface Supplier {
  id: string
  company_name: string
  trading_name?: string
}

interface Account {
  id: string
  name: string
  type: string
}

interface CostCenter {
  id: string
  name: string
  description?: string
}

interface Category {
  id: string
  name: string
  type: 'receita' | 'despesa'
  color: string
}

interface UploadedFile {
  name: string
  size: number
  type: string
  url?: string
}

export default function NewDespesaModal({
  isOpen,
  onClose,
  onSuccess,
  editData
}: NewDespesaModalProps) {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<'observacoes' | 'anexo'>('observacoes')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      installments: 1,
      repeat_transaction: false,
      is_paid: false
    }
  })

  const repeatTransaction = watch('repeat_transaction')
  const installmentType = watch('installment_type')
  const installments = watch('installments')
  const repeatFrequency = watch('repeat_frequency')

  useEffect(() => {
    if (isOpen) {
      loadSuppliers()
      loadAccounts()
      loadCostCenters()
      loadCategories()

      if (editData) {
        setValue('supplier_id', editData.supplier_id || '')
        setValue('transaction_date', editData.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0])
        setValue('description', editData.description || '')
        setValue('amount', editData.amount || 0)
        setValue('category', editData.category || '')
        setValue('cost_center', editData.cost_center || '')
        setValue('reference_code', editData.reference_code || '')
        setValue('due_date', editData.due_date?.split('T')[0] || new Date().toISOString().split('T')[0])
        setValue('payment_method', editData.payment_method || '')
        setValue('account_id', editData.account_id || '')
        setValue('is_paid', ['pago'].includes(editData.status))
        setValue('notes', editData.notes || '')
        setValue('installments', editData.installments || 1)
        setValue('installment_type', editData.installments > 1 ? 'parcelado' : 'vista')
      }
    } else {
      reset()
      setUploadedFiles([])
    }
  }, [isOpen, editData, setValue, reset])

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, company_name, trading_name')
        .eq('is_active', true)
        .order('company_name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err)
    }
  }

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, type')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAccounts(data || [])
    } catch (err) {
      console.error('Erro ao carregar contas:', err)
    }
  }

  const loadCostCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCostCenters(data || [])
    } catch (err) {
      console.error('Erro ao carregar centros de custo:', err)
    }
  }

  // ✅ CORREÇÃO: Tabela correta custom_categories
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('id, name, type, color')
        .eq('type', 'despesa')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  const onSubmit = async (data: DespesaFormData) => {
    try {
      setLoading(true)

      const transactionData = {
        description: data.description,
        amount: data.amount,
        type: 'despesa' as const,
        category: data.category,
        status: data.is_paid ? 'pago' : 'pendente' as const,
        transaction_date: data.transaction_date,
        due_date: data.due_date,
        payment_date: data.is_paid ? new Date().toISOString() : null,
        account_id: data.account_id,
        supplier_id: data.supplier_id,
        cost_center: data.cost_center || null,
        reference_code: data.reference_code || null,
        payment_method: data.payment_method,
        installments: data.installment_type === 'parcelado' ? data.installments : 1,
        notes: data.notes || null
      }

      if (editData) {
        const { error } = await supabase
          .from('financial_transactions')
          .update(transactionData)
          .eq('id', editData.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('financial_transactions')
          .insert([transactionData])

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar despesa:', error)
      alert('Erro ao salvar despesa')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setUploading(true)
    const newFiles: UploadedFile[] = []

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Arquivo ${file.name} é muito grande. Máximo 10MB.`)
        continue
      }

      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type
      })
    }

    setUploadedFiles(prev => [...prev, ...newFiles])
    setUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ✅ CORREÇÃO: Header com botão X mais visível */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editData ? 'Editar Despesa' : 'Nova Despesa'}
              </h2>
              <p className="text-sm text-gray-500">
                {editData ? 'Atualize os dados da despesa' : 'Registre uma nova saída de despesa'}
              </p>
            </div>
          </div>
          
          {/* ✅ CORREÇÃO: Botão X com melhor visibilidade e z-index */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10 text-gray-600 hover:text-gray-800"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Fornecedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor
                </label>
                <select
                  {...register('supplier_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                      {supplier.trading_name && ` (${supplier.trading_name})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Transação *
                </label>
                <input
                  type="date"
                  {...register('transaction_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent"
                />
                {errors.transaction_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.transaction_date.message}</p>
                )}
              </div>
            </div>

            {/* Descrição e Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  {...register('description')}
                  placeholder="Ex: Compra de material de escritório"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>
            </div>

            {/* Categoria e Centro de Custo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Centro de Custo
                </label>
                <select
                  {...register('cost_center')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione um centro de custo</option>
                  {costCenters.map(center => (
                    <option key={center.id} value={center.name}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Código de Referência e Data de Vencimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Referência
                </label>
                <input
                  type="text"
                  {...register('reference_code')}
                  placeholder="Ex: #001, NF-123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  {...register('due_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent"
                />
                {errors.due_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>
                )}
              </div>
            </div>

            {/* Método de Pagamento e Conta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pagamento *
                </label>
                <select
                  {...register('payment_method')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione o método</option>
                  <option value="transferencia">Transferência</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cheque">Cheque</option>
                </select>
                {errors.payment_method && (
                  <p className="text-red-500 text-sm mt-1">{errors.payment_method.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta de Pagamento *
                </label>
                <select
                  {...register('account_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione uma conta</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
                {errors.account_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.account_id.message}</p>
                )}
              </div>
            </div>

            {/* Parcelamento */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Pagamento
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      {...register('installment_type')}
                      value="vista"
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">À vista</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      {...register('installment_type')}
                      value="parcelado"
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Parcelado</span>
                  </label>
                </div>
              </div>

              {installmentType === 'parcelado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Parcelas
                  </label>
                  <select
                    {...register('installments', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent max-w-xs"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}x
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Transação Recorrente */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('repeat_transaction')}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Transação recorrente
                </label>
              </div>

              {repeatTransaction && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequência
                  </label>
                  <select
                    {...register('repeat_frequency')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent max-w-xs"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('is_paid')}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Despesa já foi paga
              </label>
            </div>

            {/* Tabs para Observações e Anexos */}
            <div className="border border-gray-200 rounded-lg">
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('observacoes')}
                  className={`px-4 py-3 text-sm font-medium flex items-center space-x-2 ${
                    activeTab === 'observacoes'
                      ? 'border-b-2 border-red-500 text-red-600 bg-red-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Observações</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('anexo')}
                  className={`px-4 py-3 text-sm font-medium flex items-center space-x-2 ${
                    activeTab === 'anexo'
                      ? 'border-b-2 border-red-500 text-red-600 bg-red-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                  <span>Anexos ({uploadedFiles.length})</span>
                </button>
              </div>

              <div className="p-4">
                {activeTab === 'observacoes' && (
                  <div>
                    <textarea
                      {...register('notes')}
                      rows={4}
                      placeholder="Informações adicionais sobre esta despesa..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                {activeTab === 'anexo' && (
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-400 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Clique para fazer upload ou arraste arquivos aqui
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG até 10MB
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Salvando...' : (editData ? 'Atualizar' : 'Salvar')} Despesa
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}