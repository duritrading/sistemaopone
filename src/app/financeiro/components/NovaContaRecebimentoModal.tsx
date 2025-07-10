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
  Banknote
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
  account_number: string
  agency: string
  account_digit: string
  balance: number
  credit_limit: number
  is_main: boolean
  is_active: boolean
  notes: string
  pix_key: string
  bank_code: string
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
    account_number: '',
    agency: '',
    account_digit: '',
    balance: 0,
    credit_limit: 0,
    is_main: false,
    is_active: true,
    notes: '',
    pix_key: '',
    bank_code: ''
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        type: editData.type || 'conta_corrente',
        bank: editData.bank || '',
        account_number: editData.account_number || '',
        agency: editData.agency || '',
        account_digit: editData.account_digit || '',
        balance: editData.balance || 0,
        credit_limit: editData.credit_limit || 0,
        is_main: editData.is_main || false,
        is_active: editData.is_active ?? true,
        notes: editData.notes || '',
        pix_key: editData.pix_key || '',
        bank_code: editData.bank_code || ''
      })
    } else {
      // Reset form for new account
      setFormData({
        name: '',
        type: 'conta_corrente',
        bank: '',
        account_number: '',
        agency: '',
        account_digit: '',
        balance: 0,
        credit_limit: 0,
        is_main: false,
        is_active: true,
        notes: '',
        pix_key: '',
        bank_code: ''
      })
    }
  }, [editData])

  if (!isOpen) return null

  const accountTypes = [
    { value: 'conta_corrente', label: 'Conta Corrente', icon: '🏦' },
    { value: 'conta_poupanca', label: 'Conta Poupança', icon: '💰' },
    { value: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' },
    { value: 'cartao_debito', label: 'Cartão de Débito', icon: '💳' },
    { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
    { value: 'investimento', label: 'Investimento', icon: '📈' },
    { value: 'outros', label: 'Outros', icon: '📝' }
  ]

  const popularBanks = [
    'Banco do Brasil', 'Bradesco', 'Itaú', 'Santander', 'Caixa Econômica Federal',
    'Nubank', 'Inter', 'C6 Bank', 'Neon', 'Original', 'Safra', 'Sicoob', 'Sicredi'
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
        ...formData,
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
                {editData ? 'Atualize as informações da conta' : 'Cadastre uma nova conta bancária ou meio de pagamento'}
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
            {/* Nome e Tipo da Conta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Conta *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Banknote className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    placeholder="Ex: Banco do Brasil - Conta Principal"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Conta *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  required
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Banco */}
            {['conta_corrente', 'conta_poupanca', 'cartao_credito', 'cartao_debito'].includes(formData.type) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banco
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      list="banks"
                      value={formData.bank}
                      onChange={(e) => handleInputChange('bank', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="Nome do banco"
                    />
                    <datalist id="banks">
                      {popularBanks.map(bank => (
                        <option key={bank} value={bank} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código do Banco
                  </label>
                  <input
                    type="text"
                    value={formData.bank_code}
                    onChange={(e) => handleInputChange('bank_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    placeholder="Ex: 001, 033, 104"
                  />
                </div>
              </div>
            )}

            {/* Dados Bancários */}
            {['conta_corrente', 'conta_poupanca'].includes(formData.type) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Conta
                  </label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => handleInputChange('account_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    placeholder="00000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dígito
                  </label>
                  <input
                    type="text"
                    value={formData.account_digit}
                    onChange={(e) => handleInputChange('account_digit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    placeholder="0"
                    maxLength={1}
                  />
                </div>
              </div>
            )}

            {/* Chave PIX */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave PIX (Opcional)
              </label>
              <input
                type="text"
                value={formData.pix_key}
                onChange={(e) => handleInputChange('pix_key', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              />
            </div>

            {/* Saldo e Limite */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Inicial
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance || ''}
                    onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    placeholder="0,00"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBalance(!showBalance)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showBalance ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {showBalance && (
                  <p className="text-sm text-gray-600 mt-1">
                    Valor formatado: {formatCurrency(formData.balance)}
                  </p>
                )}
              </div>

              {formData.type === 'cartao_credito' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite de Crédito
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.credit_limit || ''}
                      onChange={(e) => handleInputChange('credit_limit', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>
                </div>
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

            {/* Configurações */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_main"
                  checked={formData.is_main}
                  onChange={(e) => handleInputChange('is_main', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_main" className="ml-2 block text-sm text-gray-900">
                  Conta principal (será usada como padrão nas transações)
                </label>
              </div>

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
            </div>

            {/* Preview da Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visualização da Conta
              </label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {formData.name || 'Nome da conta'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {accountTypes.find(type => type.value === formData.type)?.label || 'Tipo de conta'}
                        {formData.bank && ` - ${formData.bank}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${formData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(formData.balance)}
                    </p>
                    <div className="flex items-center space-x-1">
                      {formData.is_main && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Principal
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        formData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {formData.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informação de Segurança */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0">
                  🔒
                </div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 mb-1">Segurança</h3>
                  <p className="text-sm text-yellow-700">
                    Todas as informações bancárias são criptografadas e armazenadas com segurança. 
                    Nunca compartilhe suas credenciais de acesso com terceiros.
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