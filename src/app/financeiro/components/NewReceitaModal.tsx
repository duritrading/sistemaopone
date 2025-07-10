// src/app/financeiro/components/NewReceitaModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  X, Calendar, DollarSign, HelpCircle, Upload, File, 
  Repeat, CreditCard, Tag, Building2, User, Paperclip 
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
  onSuccess
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
    }
  }, [isOpen])

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
        .from('custom_categories')
        .select('id, name, type, color')
        .eq('is_active', true)
        .eq('type', 'receita')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  const getRepeatPeriodLabel = (frequency: string) => {
    switch (frequency) {
      case 'mensal':
        return 'Por quantos meses?'
      case 'trimestral':
        return 'Por quantos trimestres?'
      case 'semestral':
        return 'Por quantos semestres?'
      case 'anual':
        return 'Por quantos anos?'
      default:
        return 'Por quantos períodos?'
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newFiles: UploadedFile[] = []

    for (const file of Array.from(files)) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert(`Arquivo ${file.name} não é permitido. Use apenas JPG, PNG ou PDF.`)
        continue
      }

      // Validar tamanho (10MB max)
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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const generateInstallmentDates = (baseDate: string, count: number): string[] => {
    const dates: string[] = []
    const startDate = new Date(baseDate)
    
    for (let i = 0; i < count; i++) {
      const installmentDate = new Date(startDate)
      installmentDate.setMonth(installmentDate.getMonth() + i)
      dates.push(installmentDate.toISOString().split('T')[0])
    }
    
    return dates
  }

  const createRecurringTransactions = async (baseData: any, frequency: string, months: number) => {
    const transactions = []
    const startDate = new Date(baseData.transaction_date)
    
    for (let i = 0; i < months; i++) {
      const transactionDate = new Date(startDate)
      const dueDate = new Date(baseData.due_date)
      
      switch (frequency) {
        case 'mensal':
          transactionDate.setMonth(transactionDate.getMonth() + i)
          dueDate.setMonth(dueDate.getMonth() + i)
          break
        case 'trimestral':
          transactionDate.setMonth(transactionDate.getMonth() + (i * 3))
          dueDate.setMonth(dueDate.getMonth() + (i * 3))
          break
        case 'semestral':
          transactionDate.setMonth(transactionDate.getMonth() + (i * 6))
          dueDate.setMonth(dueDate.getMonth() + (i * 6))
          break
        case 'anual':
          transactionDate.setFullYear(transactionDate.getFullYear() + i)
          dueDate.setFullYear(dueDate.getFullYear() + i)
          break
      }

      transactions.push({
        ...baseData,
        description: `${baseData.description} (${i + 1}/${months})`,
        transaction_date: transactionDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0]
      })
    }
    
    return transactions
  }

  const onSubmit = async (data: ReceitaFormData) => {
    setLoading(true)
    
    try {
      const selectedClient = clients.find(c => c.id === data.client_id)
      
      const baseTransactionData = {
        description: data.description,
        amount: data.amount,
        type: 'receita' as const,
        category: data.category,
        status: data.is_received ? 'recebido' : 'pendente',
        transaction_date: data.transaction_date,
        due_date: data.due_date,
        payment_date: data.is_received ? new Date().toISOString() : null,
        account_id: data.account_id,
        client_id: data.client_id,
        notes: data.notes,
        payment_method: data.payment_method,
        cost_center: data.cost_center,
        reference_code: data.reference_code,
        installments: installmentType === 'parcelado' ? data.installments : 1,
        attachments: uploadedFiles.map(f => f.name)
      }

      let transactionsToCreate = []

      if (data.repeat_transaction && data.repeat_frequency && data.repeat_months) {
        // Criar transações recorrentes
        transactionsToCreate = await createRecurringTransactions(
          baseTransactionData,
          data.repeat_frequency,
          data.repeat_months
        )
      } else if (installmentType === 'parcelado' && data.installments > 1) {
        // Criar parcelas
        const installmentDates = generateInstallmentDates(data.due_date, data.installments)
        const installmentAmount = data.amount / data.installments

        transactionsToCreate = installmentDates.map((date, index) => ({
          ...baseTransactionData,
          description: `${data.description} (${index + 1}/${data.installments})`,
          amount: installmentAmount,
          due_date: date,
          installments: 1 // Cada parcela é individual
        }))
      } else {
        // Transação única
        transactionsToCreate = [baseTransactionData]
      }

      // Inserir todas as transações
      const { error } = await supabase
        .from('financial_transactions')
        .insert(transactionsToCreate)

      if (error) throw error

      onSuccess()
      handleClose()
      
      const message = transactionsToCreate.length > 1 
        ? `${transactionsToCreate.length} transações criadas com sucesso!`
        : 'Receita criada com sucesso!'
      alert(message)
      
    } catch (err: any) {
      console.error('Erro ao criar receita:', err)
      alert('Erro ao criar receita: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setUploadedFiles([])
    setCostCenters([])
    setCategories([])
    setActiveTab('observacoes')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Nova receita</h2>
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
              {/* Cliente */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    {...register('client_id')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  >
                    <option value="">Selecione o cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.client_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.client_id.message}</p>
                )}
              </div>

              {/* Data de competência */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de competência *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    {...register('transaction_date')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>
                {errors.transaction_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.transaction_date.message}</p>
                )}
              </div>

              {/* Descrição */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  {...register('description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  placeholder="Descrição da receita"
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
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
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
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    {...register('category')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  >
                    <option value="">Selecione a categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              {/* Centro de custo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Centro de custo
                </label>
                <select
                  {...register('cost_center')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione o centro de custo</option>
                  {costCenters.map(costCenter => (
                    <option key={costCenter.id} value={costCenter.name}>
                      {costCenter.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Código de referência */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de referência
                </label>
                <input
                  type="text"
                  {...register('reference_code')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  placeholder="Ref. interna"
                />
              </div>
            </div>
          </div>

          {/* Configurações de repetição */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-700">Configurações de lançamento</h3>
            
            {/* Repetir lançamento */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="repeat_transaction"
                {...register('repeat_transaction')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="repeat_transaction" className="text-sm font-medium text-gray-700 flex items-center">
                <Repeat className="w-4 h-4 mr-1" />
                Repetir lançamento
              </label>
            </div>

            {/* Opções de repetição */}
            {repeatTransaction && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequência
                  </label>
                  <select
                    {...register('repeat_frequency')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {getRepeatPeriodLabel(repeatFrequency || '')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    {...register('repeat_months', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    placeholder={repeatFrequency === 'anual' ? 'Ex: 3' : 'Ex: 12'}
                  />
                </div>
              </div>
            )}

            {/* Tipo de pagamento */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de pagamento
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="radio"
                    id="vista"
                    value="vista"
                    {...register('installment_type')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="vista"
                    className={`block w-full p-3 border rounded-lg cursor-pointer transition-colors ${
                      installmentType === 'vista'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">À vista</div>
                      <div className="text-sm text-gray-600">Pagamento único</div>
                    </div>
                  </label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="parcelado"
                    value="parcelado"
                    {...register('installment_type')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="parcelado"
                    className={`block w-full p-3 border rounded-lg cursor-pointer transition-colors ${
                      installmentType === 'parcelado'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">Parcelado</div>
                      <div className="text-sm text-gray-600">Dividir em parcelas</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Configuração de parcelas */}
              {installmentType === 'parcelado' && (
                <div className="ml-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de parcelas
                  </label>
                  <select
                    {...register('installments', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>
                        {num}x de R$ {((watch('amount') || 0) / num).toFixed(2).replace('.', ',')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Configurações de pagamento */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-700">Configurações de pagamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de vencimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de vencimento *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    {...register('due_date')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>
                {errors.due_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>
                )}
              </div>

              {/* Forma de pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de pagamento *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    {...register('payment_method')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
                {errors.payment_method && (
                  <p className="text-red-500 text-sm mt-1">{errors.payment_method.message}</p>
                )}
              </div>

              {/* Conta de recebimento */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta de recebimento *
                </label>
                <select
                  {...register('account_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione a conta</option>
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

              {/* Já foi recebido */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_received"
                    {...register('is_received')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_received" className="text-sm font-medium text-gray-700">
                    Marcar como já recebido
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs para observações e anexos */}
          <div className="space-y-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('observacoes')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'observacoes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Observações
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('anexo')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'anexo'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4" />
                    <span>Anexos</span>
                    {uploadedFiles.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {uploadedFiles.length}
                      </span>
                    )}
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab de observações */}
            {activeTab === 'observacoes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  {...register('notes')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  placeholder="Observações adicionais sobre esta receita..."
                />
              </div>
            )}

            {/* Tab de anexos */}
            {activeTab === 'anexo' && (
              <div className="space-y-4">
                {/* Upload area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {uploading ? 'Enviando...' : 'Selecionar arquivos'}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    JPG, PNG ou PDF até 10MB
                  </p>
                </div>

                {/* Lista de arquivos */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Arquivos anexados:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <File className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
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

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors inline-flex items-center"
            >
              {loading ? 'Salvando...' : 'Salvar Receita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}