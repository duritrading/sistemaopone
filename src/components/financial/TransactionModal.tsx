// src/components/financial/TransactionModal.tsx
'use client'

import { useState } from 'react'
import { X, Calendar, HelpCircle, ChevronDown } from 'lucide-react'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  accounts: any[]
  clients?: any[]
  suppliers?: any[]
}

export function TransactionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  accounts, 
  clients = [], 
  suppliers = [] 
}: TransactionModalProps) {
  const [activeTab, setActiveTab] = useState<'receita' | 'despesa'>('receita')
  const [currentTab, setCurrentTab] = useState<'observacoes' | 'anexo'>('observacoes')
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    // Informações do lançamento
    client_id: '',
    supplier_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    enable_split: false,
    category: '',
    cost_center: '',
    reference_code: '',
    repeat_transaction: false,
    
    // Condição de pagamento
    installments: 1,
    due_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    account_id: '',
    is_paid: false,
    is_scheduled: false,
    nsu: '',
    
    // Observações e anexo
    notes: '',
    attachments: [] as File[]
  })

  const categories = {
    receita: [
      { value: 'receitas_servicos', label: 'Receitas de Serviços' },
      { value: 'receitas_produtos', label: 'Receitas de Produtos' },
      { value: 'receitas_outras', label: 'Outras Receitas' }
    ],
    despesa: [
      { value: 'despesas_operacionais', label: 'Despesas Operacionais' },
      { value: 'despesas_administrativas', label: 'Despesas Administrativas' },
      { value: 'despesas_pessoal', label: 'Despesas com Pessoal' },
      { value: 'despesas_marketing', label: 'Despesas de Marketing' },
      { value: 'despesas_tecnologia', label: 'Despesas de Tecnologia' },
      { value: 'despesas_outras', label: 'Outras Despesas' }
    ]
  }

  const costCenters = [
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'operacional', label: 'Operacional' },
    { value: 'tecnologia', label: 'Tecnologia' },
    { value: 'marketing', label: 'Marketing' }
  ]

  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'PIX' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'boleto', label: 'Boleto' }
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description.trim()) {
      alert('Descrição é obrigatória')
      return
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Valor deve ser maior que zero')
      return
    }
    
    if (!formData.account_id) {
      alert('Conta é obrigatória')
      return
    }

    setLoading(true)
    
    try {
      const transactionData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: activeTab,
        category: formData.category || (activeTab === 'receita' ? 'receitas_servicos' : 'despesas_operacionais'),
        account_id: formData.account_id,
        transaction_date: formData.transaction_date,
        due_date: formData.due_date,
        client_id: activeTab === 'receita' ? formData.client_id || null : null,
        supplier_id: activeTab === 'despesa' ? formData.supplier_id || null : null,
        cost_center: formData.cost_center || null,
        reference_code: formData.reference_code || null,
        payment_method: formData.payment_method || null,
        installments: formData.installments,
        notes: formData.notes || null,
        status: formData.is_paid ? (activeTab === 'receita' ? 'recebido' : 'pago') : 'pendente',
        payment_date: formData.is_paid ? new Date().toISOString() : null
      }

      await onSave(transactionData)
      
      // Reset form
      setFormData({
        client_id: '',
        supplier_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        enable_split: false,
        category: '',
        cost_center: '',
        reference_code: '',
        repeat_transaction: false,
        installments: 1,
        due_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        account_id: '',
        is_paid: false,
        is_scheduled: false,
        nsu: '',
        notes: '',
        attachments: []
      })
      
      onClose()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro ao salvar transação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Nova {activeTab === 'receita' ? 'receita' : 'despesa'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toggle Receita/Despesa */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex bg-gray-100 rounded-lg p-1 max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('receita')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'receita'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('despesa')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'despesa'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Despesa
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Informações do lançamento */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informações do lançamento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Cliente/Fornecedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === 'receita' ? 'Cliente' : 'Fornecedor'}
                  </label>
                  <div className="relative">
                    <select
                      value={activeTab === 'receita' ? formData.client_id : formData.supplier_id}
                      onChange={(e) => handleInputChange(
                        activeTab === 'receita' ? 'client_id' : 'supplier_id', 
                        e.target.value
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="">Selecione...</option>
                      {activeTab === 'receita' 
                        ? clients.map(client => (
                            <option key={client.id} value={client.id}>
                              {client.company_name}
                            </option>
                          ))
                        : suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))
                      }
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  {activeTab === 'receita' && (
                    <button 
                      type="button"
                      className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <span>📋 Consultar cliente no Serasa</span>
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Data de competência */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de competência <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Digite a descrição do lançamento"
                    required
                  />
                </div>

                {/* Habilitar rateio */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enable_split"
                    checked={formData.enable_split}
                    onChange={(e) => handleInputChange('enable_split', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="enable_split" className="ml-2 text-sm text-gray-700">
                    Habilitar rateio
                  </label>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria <span className="text-red-500">*</span>
                    <HelpCircle className="inline w-3 h-3 ml-1 text-gray-400" />
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      required
                    >
                      <option value="">Selecione...</option>
                      {categories[activeTab].map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Centro de custo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Centro de custo
                    <HelpCircle className="inline w-3 h-3 ml-1 text-gray-400" />
                  </label>
                  <div className="relative">
                    <select
                      value={formData.cost_center}
                      onChange={(e) => handleInputChange('cost_center', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="">Selecione...</option>
                      {costCenters.map(center => (
                        <option key={center.value} value={center.value}>
                          {center.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Código de referência */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de referência
                    <HelpCircle className="inline w-3 h-3 ml-1 text-gray-400" />
                  </label>
                  <input
                    type="text"
                    value={formData.reference_code}
                    onChange={(e) => handleInputChange('reference_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Ex: NF-2025-001"
                  />
                </div>

                {/* Repetir lançamento */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="repeat_transaction"
                    checked={formData.repeat_transaction}
                    onChange={(e) => handleInputChange('repeat_transaction', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="repeat_transaction" className="ml-2 text-sm text-gray-700">
                    Repetir lançamento?
                  </label>
                </div>
              </div>
            </div>

            {/* Condição de pagamento */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Condição de pagamento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Parcelamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parcelamento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.installments}
                      onChange={(e) => handleInputChange('installments', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value={1}>À vista</option>
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+2} value={i+2}>{i+2}x</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Vencimento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vencimento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => handleInputChange('due_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Forma de pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de pagamento
                  </label>
                  <div className="relative">
                    <select
                      value={formData.payment_method}
                      onChange={(e) => handleInputChange('payment_method', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="">Selecione...</option>
                      {paymentMethods.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Conta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conta de {activeTab === 'receita' ? 'recebimento' : 'pagamento'}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.account_id}
                      onChange={(e) => handleInputChange('account_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      required
                    >
                      <option value="">Selecione...</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Checkboxes de status */}
              <div className="mt-4 flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_paid}
                    onChange={(e) => handleInputChange('is_paid', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {activeTab === 'receita' ? 'Recebido' : 'Pago'}
                  </span>
                  <HelpCircle className="w-3 h-3 ml-1 text-gray-400" />
                </label>
                
                {activeTab === 'despesa' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_scheduled}
                      onChange={(e) => handleInputChange('is_scheduled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Agendado</span>
                    <HelpCircle className="w-3 h-3 ml-1 text-gray-400" />
                  </label>
                )}
              </div>
            </div>

            {/* NSU (apenas para receitas) */}
            {activeTab === 'receita' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Informar NSU
                  <HelpCircle className="inline w-3 h-3 ml-1 text-gray-400" />
                </label>
                <input
                  type="text"
                  value={formData.nsu}
                  onChange={(e) => handleInputChange('nsu', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Número sequencial único"
                />
              </div>
            )}

            {/* Observações e Anexos */}
            <div>
              <div className="flex border-b">
                <button
                  type="button"
                  onClick={() => setCurrentTab('observacoes')}
                  className={`px-4 py-2 border-b-2 font-medium text-sm ${
                    currentTab === 'observacoes'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Observações
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('anexo')}
                  className={`px-4 py-2 border-b-2 font-medium text-sm ${
                    currentTab === 'anexo'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Anexo
                </button>
              </div>
              
              <div className="mt-4">
                {currentTab === 'observacoes' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Descreva observações relevantes sobre esse lançamento financeiro"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anexos
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <div className="text-sm text-gray-600">
                          <p>Arraste arquivos aqui ou clique para enviar</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, PDF até 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Voltar
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <span>Salvar</span>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}