'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  X, Calendar, DollarSign, HelpCircle, Upload, File, 
  Repeat, CreditCard, Tag, Building2, User, Paperclip, CheckCircle 
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const receitaSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  transaction_date: z.string().min(1, 'Data de competência é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  cost_center: z.string().optional(),
  reference_code: z.string().optional(),
  repeat_transaction: z.boolean().default(false),
  repeat_frequency: z.enum(['mensal', 'trimestral', 'semestral', 'anual']).optional(),
  repeat_months: z.number().min(1).max(120).optional(),
  installment_type: z.enum(['vista', 'parcelado']).default('vista'),
  installments: z.number().min(1).max(12).default(1),
  due_date: z.string().min(1, 'Vencimento é obrigatório'),
  payment_method: z.string().min(1, 'Forma de pagamento é obrigatória'),
  account_id: z.string().min(1, 'Conta de recebimento é obrigatória'),
  is_received: z.boolean().default(false),
  notes: z.string().optional()
})

type ReceitaFormData = z.infer<typeof receitaSchema>

interface NewReceitaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: any
}

interface Client {
  id: string
  company_name: string
  relationship_status?: string
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

export default function NewReceitaModal({
  isOpen,
  onClose,
  onSuccess,
  editData
}: NewReceitaModalProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
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
  } = useForm<ReceitaFormData>({
    resolver: zodResolver(receitaSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      installment_type: 'vista',
      installments: 1,
      repeat_transaction: false,
      is_received: false
    }
  })

  const repeatTransaction = watch('repeat_transaction')
  const installmentType = watch('installment_type')
  const installments = watch('installments')
  const repeatFrequency = watch('repeat_frequency')

  useEffect(() => {
    if (isOpen) {
      loadClients()
      loadAccounts()
      loadCostCenters()
      loadCategories()

      // Load edit data if provided
      if (editData) {
        setValue('client_id', editData.client_id || '')
        setValue('transaction_date', editData.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0])
        setValue('description', editData.description || '')
        setValue('amount', editData.amount || 0)
        setValue('category', editData.category || '')
        setValue('cost_center', editData.cost_center || '')
        setValue('reference_code', editData.reference_code || '')
        setValue('due_date', editData.due_date?.split('T')[0] || new Date().toISOString().split('T')[0])
        setValue('payment_method', editData.payment_method || '')
        setValue('account_id', editData.account_id || '')
        setValue('is_received', ['recebido'].includes(editData.status))
        setValue('notes', editData.notes || '')
        setValue('installments', editData.installments || 1)
        setValue('installment_type', editData.installments > 1 ? 'parcelado' : 'vista')
      }
    } else {
      reset()
      setUploadedFiles([])
    }
  }, [isOpen, editData, setValue, reset])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, relationship_status')
        .eq('is_active', true)
        .order('company_name')

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
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

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, type, color')
        .eq('type', 'receita')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  const onSubmit = async (data: ReceitaFormData) => {
    try {
      setLoading(true)

      const transactionData = {
        description: data.description,
        amount: data.amount,
        type: 'receita' as const,
        category: data.category,
        status: data.is_received ? 'recebido' : 'pendente' as const,
        transaction_date: data.transaction_date,
        due_date: data.due_date,
        payment_date: data.is_received ? new Date().toISOString() : null,
        account_id: data.account_id,
        client_id: data.client_id,
        cost_center: data.cost_center || null,
        reference_code: data.reference_code || null,
        payment_method: data.payment_method,
        installments: data.installment_type === 'parcelado' ? data.installments : 1,
        notes: data.notes || null
      }

      if (editData) {
        const { error } = await supabase
          .from('financial_transactions')
          .update({
            ...transactionData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editData.id)

        if (error) throw error
      } else {
        if (data.repeat_transaction && data.repeat_frequency && data.repeat_months) {
          const transactions = []
          const baseDate = new Date(data.transaction_date)
          
          for (let i = 0; i < data.repeat_months; i++) {
            const currentDate = new Date(baseDate)
            
            switch (data.repeat_frequency) {
              case 'mensal':
                currentDate.setMonth(baseDate.getMonth() + i)
                break
              case 'trimestral':
                currentDate.setMonth(baseDate.getMonth() + (i * 3))
                break
              case 'semestral':
                currentDate.setMonth(baseDate.getMonth() + (i * 6))
                break
              case 'anual':
                currentDate.setFullYear(baseDate.getFullYear() + i)
                break
            }

            transactions.push({
              ...transactionData,
              transaction_date: currentDate.toISOString().split('T')[0],
              due_date: currentDate.toISOString().split('T')[0]
            })
          }

          const { error } = await supabase
            .from('financial_transactions')
            .insert(transactions)

          if (error) throw error
        } else if (data.installment_type === 'parcelado' && data.installments > 1) {
          const transactions = []
          const baseDate = new Date(data.due_date)
          const installmentAmount = data.amount / data.installments

          for (let i = 0; i < data.installments; i++) {
            const dueDate = new Date(baseDate)
            dueDate.setMonth(baseDate.getMonth() + i)

            transactions.push({
              ...transactionData,
              amount: installmentAmount,
              due_date: dueDate.toISOString().split('T')[0],
              description: `${data.description} (${i + 1}/${data.installments})`
            })
          }

          const { error } = await supabase
            .from('financial_transactions')
            .insert(transactions)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('financial_transactions')
            .insert([transactionData])

          if (error) throw error
        }
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar receita:', error)
      alert('Erro ao salvar receita. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    
    try {
      for (const file of files) {
        const newFile: UploadedFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        }
        
        setUploadedFiles(prev => [...prev, newFile])
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload dos arquivos')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  const isEditMode = !!editData

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Editar Receita' : 'Nova Receita'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Cliente *
            </label>
            <select
              {...register('client_id')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Selecione um cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
            )}
          </div>

          {/* Data de competência e descrição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Data de Competência *
              </label>
              <input
                type="date"
                {...register('transaction_date')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {errors.transaction_date && (
                <p className="mt-1 text-sm text-red-600">{errors.transaction_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Vencimento *
              </label>
              <input
                type="date"
                {...register('due_date')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Descrição *
            </label>
            <input
              type="text"
              {...register('description')}
              placeholder="Ex: Prestação de serviços de consultoria"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Valor e categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Valor *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Categoria *
              </label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Centro de custo e código de referência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Centro de Custo
              </label>
              <select
                {...register('cost_center')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Selecione um centro de custo</option>
                {costCenters.map(center => (
                  <option key={center.id} value={center.name}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Código de Referência
              </label>
              <input
                type="text"
                {...register('reference_code')}
                placeholder="Ex: NF-001, OS-123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Parcelamento */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Parcelamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tipo de Pagamento
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="vista"
                      {...register('installment_type')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">À vista</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="parcelado"
                      {...register('installment_type')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">Parcelado</span>
                  </label>
                </div>
              </div>

              {installmentType === 'parcelado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Número de Parcelas
                  </label>
                  <select
                    {...register('installments', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}x</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Recorrência */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Repeat className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Transação Recorrente</h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('repeat_transaction')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-900">
                  Esta é uma transação recorrente
                </span>
              </label>

              {repeatTransaction && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Frequência
                    </label>
                    <select
                      {...register('repeat_frequency')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Selecione a frequência</option>
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Repetir por quantos períodos?
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      {...register('repeat_months', { valueAsNumber: true })}
                      placeholder="Ex: 12"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Forma de pagamento e conta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Forma de Pagamento *
              </label>
              <select
                {...register('payment_method')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Selecione a forma de pagamento</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="transferencia">Transferência Bancária</option>
                <option value="boleto">Boleto</option>
              </select>
              {errors.payment_method && (
                <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Conta de Recebimento *
              </label>
              <select
                {...register('account_id')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Selecione a conta</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
              {errors.account_id && (
                <p className="mt-1 text-sm text-red-600">{errors.account_id.message}</p>
              )}
            </div>
          </div>

          {/* Status de recebimento */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('is_received')}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">
                  Marcar como recebido
                </span>
              </div>
            </label>
            <p className="mt-2 text-sm text-gray-500">
              Marque esta opção se o valor já foi recebido
            </p>
          </div>

          {/* Tabs para observações e anexos */}
          <div className="border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8" aria-label="Tabs">
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
                  Anexos
                </button>
              </nav>
            </div>

            <div className="p-4">
              {activeTab === 'observacoes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Observações
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={4}
                    placeholder="Adicione observações sobre esta receita..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
              )}

              {activeTab === 'anexo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Anexos
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Clique para adicionar arquivos ou arraste aqui
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {uploading ? 'Enviando...' : 'Selecionar Arquivos'}
                    </button>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <File className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Salvando...' : (isEditMode ? 'Atualizar' : 'Salvar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}