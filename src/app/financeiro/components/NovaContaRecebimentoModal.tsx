// src/app/financeiro/components/NovaContaRecebimentoModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  X, 
  Save, 
  CreditCard, 
  Building2, 
  DollarSign,
  Eye,
  EyeOff,
  Info
} from 'lucide-react'

interface NovaContaRecebimentoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: any
}

interface AccountFormData {
  name: string
  type: string
  bank: string
  balance: number
  account_number: string
  agency: string
  account_holder: string
  cpf_cnpj: string
  pix_key: string
  is_active: boolean
  notes: string
}

export default function NovaContaRecebimentoModal({
  isOpen,
  onClose,
  onSuccess,
  editData
}: NovaContaRecebimentoModalProps) {
  const [loading, setLoading] = useState(false)
  const [showBalance, setShowBalance] = useState(false)
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'conta_corrente',
    bank: '',
    balance: 0,
    account_number: '',
    agency: '',
    account_holder: '',
    cpf_cnpj: '',
    pix_key: '',
    is_active: true,
    notes: ''
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        type: editData.type || 'conta_corrente',
        bank: editData.bank || '',
        balance: editData.balance || 0,
        account_number: editData.account_number || '',
        agency: editData.agency || '',
        account_holder: editData.account_holder || '',
        cpf_cnpj: editData.cpf_cnpj || '',
        pix_key: editData.pix_key || '',
        is_active: editData.is_active ?? true,
        notes: editData.notes || ''
      })
    } else {
      // Reset form for new account
      setFormData({
        name: '',
        type: 'conta_corrente',
        bank: '',
        balance: 0,
        account_number: '',
        agency: '',
        account_holder: '',
        cpf_cnpj: '',
        pix_key: '',
        is_active: true,
        notes: ''
      })
    }
  }, [editData])

  if (!isOpen) return null

  const accountTypes = [
    { value: 'conta_corrente', label: 'Conta Corrente', icon: '🏦' },
    { value: 'conta_poupanca', label: 'Conta Poupança', icon: '💰' },
    { value: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' },
    { value: 'cartao_debito', label: 'Cartão de Débito', icon: '💴' },
    { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
    { value: 'investimento', label: 'Investimento', icon: '📈' },
    { value: 'outros', label: 'Outros', icon: '📊' }
  ]

  const popularBanks = [
    'Banco do Brasil',
    'Bradesco',
    'Caixa Econômica Federal',
    'Itaú',
    'Santander',
    'BTG Pactual',
    'Inter',
    'Nubank',
    'C6 Bank',
    'PicPay',
    'Mercado Pago',
    'Outro'
  ]

  const handleInputChange = (field: keyof AccountFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const accountData = {
        name: formData.name,
        type: formData.type,
        bank: formData.bank || null,
        balance: formData.balance,
        account_number: formData.account_number || null,
        agency: formData.agency || null,
        account_holder: formData.account_holder || null,
        cpf_cnpj: formData.cpf_cnpj || null,
        pix_key: formData.pix_key || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      }

      if (editData) {
        // Update existing account
        const { error } = await supabase
          .from('accounts')
          .update(accountData)
          .eq('id', editData.id)

        if (error) throw error
      } else {
        // Create new account
        const { error } = await supabase
          .from('accounts')
          .insert([{
            ...accountData,
            created_at: new Date().toISOString()
          }])

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar conta:', err)
      alert(`Erro ao ${editData ? 'atualizar' : 'criar'} conta: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const selectedAccountType = accountTypes.find(type => type.value === formData.type)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editData ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              <p className="text-sm text-gray-600">
                {editData ? 'Atualize as informações da conta' : 'Cadastre uma nova conta para recebimentos e pagamentos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Nome da Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Conta *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  placeholder="Ex: Conta Principal, Cartão Nubank, Caixa Empresa"
                  required
                />
              </div>
            </div>

            {/* Tipo de Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Conta *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {accountTypes.map((type) => (
                  <div key={type.value}>
                    <input
                      type="radio"
                      id={type.value}
                      name="account_type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <label
                      htmlFor={type.value}
                      className={`block w-full p-3 border rounded-lg cursor-pointer transition-colors text-center ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-xl mb-1">{type.icon}</div>
                      <div className="text-xs font-medium">{type.label}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Dados Bancários */}
            {['conta_corrente', 'conta_poupanca', 'cartao_credito', 'cartao_debito'].includes(formData.type) && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Dados Bancários
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Banco */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banco
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        value={formData.bank}
                        onChange={(e) => handleInputChange('bank', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      >
                        <option value="">Selecione o banco</option>
                        {popularBanks.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Titular da Conta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titular da Conta
                    </label>
                    <input
                      type="text"
                      value={formData.account_holder}
                      onChange={(e) => handleInputChange('account_holder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="Nome completo do titular"
                    />
                  </div>

                  {/* CPF/CNPJ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF/CNPJ do Titular
                    </label>
                    <input
                      type="text"
                      value={formData.cpf_cnpj}
                      onChange={(e) => handleInputChange('cpf_cnpj', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    />
                  </div>

                  {/* Agência */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agência
                    </label>
                    <input
                      type="text"
                      value={formData.agency}
                      onChange={(e) => handleInputChange('agency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="0000"
                    />
                  </div>

                  {/* Número da Conta */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número da Conta
                    </label>
                    <input
                      type="text"
                      value={formData.account_number}
                      onChange={(e) => handleInputChange('account_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="00000-0"
                    />
                  </div>

                  {/* Chave PIX */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chave PIX (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.pix_key}
                      onChange={(e) => handleInputChange('pix_key', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Saldo Inicial */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo {editData ? 'Atual' : 'Inicial'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showBalance ? "number" : "password"}
                  step="0.01"
                  value={formData.balance || ''}
                  onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  placeholder="0,00"
                />
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {showBalance && (
                <p className="text-sm text-gray-500 mt-1">
                  Valor atual: {formatCurrency(formData.balance)}
                </p>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                placeholder="Informações adicionais sobre esta conta..."
              />
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Conta ativa
              </label>
            </div>

            {/* Preview da Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visualização da Conta
              </label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {selectedAccountType?.icon || '💳'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {formData.name || 'Nome da conta'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedAccountType?.label || 'Tipo da conta'}
                        {formData.bank && ` • ${formData.bank}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${formData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(formData.balance)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {editData ? 'Saldo atual' : 'Saldo inicial'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações de Ajuda */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Dica: Organizando Contas</h3>
                  <p className="text-sm text-blue-700">
                    Cadastre todas as contas onde você recebe ou faz pagamentos. Isso inclui contas bancárias, 
                    cartões de crédito, carteiras digitais e até mesmo dinheiro em espécie. Use nomes 
                    descritivos para facilitar a identificação.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : (editData ? 'Atualizar' : 'Salvar')} Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}