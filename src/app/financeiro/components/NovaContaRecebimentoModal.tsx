// src/app/financeiro/components/NovaContaRecebimentoModal.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  X, 
  Save, 
  CreditCard, 
  Building,
  DollarSign,
  Eye,
  EyeOff,
  Banknote
} from 'lucide-react'

interface NovaContaRecebimentoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface AccountFormData {
  name: string
  type: 'conta_corrente' | 'conta_poupanca' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'investimento' | 'outros'
  bank: string
  balance: number
  
  // Dados bancários
  bank_code: string
  agency: string
  account_number: string
  account_digit: string
  
  // PIX
  pix_key: string
  pix_type: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'chave_aleatoria'
  
  // Cartão (se aplicável)
  card_number: string
  card_holder_name: string
  card_expiry: string
  card_limit: number
  
  is_active: boolean
  notes: string
}

export default function NovaContaRecebimentoModal({
  isOpen,
  onClose,
  onSuccess
}: NovaContaRecebimentoModalProps) {
  const [loading, setLoading] = useState(false)
  const [showCardNumber, setShowCardNumber] = useState(false)
  const [currentTab, setCurrentTab] = useState('basicos')
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'conta_corrente',
    bank: '',
    balance: 0,
    
    bank_code: '',
    agency: '',
    account_number: '',
    account_digit: '',
    
    pix_key: '',
    pix_type: 'cpf',
    
    card_number: '',
    card_holder_name: '',
    card_expiry: '',
    card_limit: 0,
    
    is_active: true,
    notes: ''
  })

  if (!isOpen) return null

  const accountTypes = [
    { value: 'conta_corrente', label: 'Conta Corrente', icon: '🏦' },
    { value: 'conta_poupanca', label: 'Conta Poupança', icon: '💰' },
    { value: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' },
    { value: 'cartao_debito', label: 'Cartão de Débito', icon: '💳' },
    { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
    { value: 'investimento', label: 'Investimento', icon: '📈' },
    { value: 'outros', label: 'Outros', icon: '📋' }
  ]

  const banks = [
    { code: '001', name: 'Banco do Brasil' },
    { code: '104', name: 'Caixa Econômica Federal' },
    { code: '341', name: 'Itaú' },
    { code: '237', name: 'Bradesco' },
    { code: '033', name: 'Santander' },
    { code: '260', name: 'Nu Pagamentos (Nubank)' },
    { code: '323', name: 'Mercado Pago' },
    { code: '077', name: 'Banco Inter' },
    { code: '290', name: 'PagSeguro' }
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
      const { error } = await supabase
        .from('accounts')
        .insert([{
          ...formData,
          balance: formData.balance || 0,
          card_limit: formData.card_limit || null,
          card_number: formData.card_number || null,
          card_holder_name: formData.card_holder_name || null,
          card_expiry: formData.card_expiry || null,
          bank_code: formData.bank_code || null,
          agency: formData.agency || null,
          account_number: formData.account_number || null,
          account_digit: formData.account_digit || null,
          pix_key: formData.pix_key || null,
          pix_type: formData.pix_key ? formData.pix_type : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao criar conta:', err)
      alert('Erro ao criar conta: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4}) (\d{4})(\d)/, '$1 $2 $3')
      .replace(/(\d{4}) (\d{4}) (\d{4})(\d)/, '$1 $2 $3 $4')
      .slice(0, 19)
  }

  const formatExpiry = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .slice(0, 5)
  }

  const isCardType = formData.type === 'cartao_credito' || formData.type === 'cartao_debito'
  const isBankAccount = formData.type === 'conta_corrente' || formData.type === 'conta_poupanca'

  const tabs = [
    { id: 'basicos', label: 'Dados Básicos', icon: CreditCard },
    { id: 'bancarios', label: 'Dados Bancários', icon: Building },
    { id: 'observacoes', label: 'Observações', icon: DollarSign }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nova Conta de Recebimento</h2>
              <p className="text-sm text-gray-600">Cadastre uma nova conta para receber pagamentos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                  currentTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Dados Básicos */}
            {currentTab === 'basicos' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome da Conta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Conta *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="Ex: Conta Corrente Principal, Cartão Nubank"
                    />
                  </div>

                  {/* Tipo da Conta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo da Conta *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    >
                      {accountTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Banco */}
                  {(isBankAccount || isCardType) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Banco *</label>
                        <select
                          required
                          value={formData.bank}
                          onChange={(e) => {
                            const selectedBank = banks.find(bank => bank.name === e.target.value)
                            handleInputChange('bank', e.target.value)
                            if (selectedBank) {
                              handleInputChange('bank_code', selectedBank.code)
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                        >
                          <option value="">Selecione o banco</option>
                          {banks.map(bank => (
                            <option key={bank.code} value={bank.name}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Código do Banco</label>
                        <input
                          type="text"
                          value={formData.bank_code}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                          placeholder="Preenchido automaticamente"
                          readOnly
                        />
                      </div>
                    </>
                  )}

                  {/* Saldo Inicial */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isCardType ? 'Limite Disponível' : 'Saldo Inicial'}
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.balance || ''}
                        onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>

                {/* Dados do Cartão - apenas para cartões */}
                {isCardType && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Cartão</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Número do Cartão</label>
                        <div className="relative">
                          <input
                            type={showCardNumber ? 'text' : 'password'}
                            value={formData.card_number}
                            onChange={(e) => handleInputChange('card_number', formatCardNumber(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                            placeholder="1234 5678 9012 3456"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCardNumber(!showCardNumber)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome no Cartão</label>
                        <input
                          type="text"
                          value={formData.card_holder_name}
                          onChange={(e) => handleInputChange('card_holder_name', e.target.value.toUpperCase())}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                          placeholder="NOME COMO NO CARTÃO"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Validade</label>
                        <input
                          type="text"
                          value={formData.card_expiry}
                          onChange={(e) => handleInputChange('card_expiry', formatExpiry(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                          placeholder="MM/AA"
                        />
                      </div>

                      {formData.type === 'cartao_credito' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Limite Total</label>
                          <div className="relative">
                            <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.card_limit || ''}
                              onChange={(e) => handleInputChange('card_limit', parseFloat(e.target.value) || 0)}
                              className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dados Bancários */}
            {currentTab === 'bancarios' && (
              <div className="space-y-6">
                {/* Dados Bancários - apenas para contas bancárias */}
                {isBankAccount && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Bancários</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agência</label>
                        <input
                          type="text"
                          value={formData.agency}
                          onChange={(e) => handleInputChange('agency', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                          placeholder="Ex: 1234"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Número da Conta</label>
                        <input
                          type="text"
                          value={formData.account_number}
                          onChange={(e) => handleInputChange('account_number', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                          placeholder="Ex: 12345678"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dígito</label>
                        <input
                          type="text"
                          value={formData.account_digit}
                          onChange={(e) => handleInputChange('account_digit', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                          placeholder="Ex: 9"
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PIX */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações PIX (Opcional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Chave PIX</label>
                      <select
                        value={formData.pix_type}
                        onChange={(e) => handleInputChange('pix_type', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">Email</option>
                        <option value="telefone">Telefone</option>
                        <option value="chave_aleatoria">Chave Aleatória</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chave PIX</label>
                      <input
                        type="text"
                        value={formData.pix_key}
                        onChange={(e) => handleInputChange('pix_key', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                        placeholder={`Digite a chave ${formData.pix_type}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {currentTab === 'observacoes' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observações Gerais</label>
                  <textarea
                    rows={6}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    placeholder="Informações adicionais sobre a conta..."
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Conta ativa</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Contas inativas não aparecerão nas opções de seleção
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>

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
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors inline-flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Conta'}
          </button>
        </div>
      </div>
    </div>
  )
}