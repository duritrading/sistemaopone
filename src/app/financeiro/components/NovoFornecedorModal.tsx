// src/app/financeiro/components/NovoFornecedorModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  X, 
  Save, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  CreditCard,
  User
} from 'lucide-react'

interface NovoFornecedorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: any
}

interface SupplierFormData {
  company_name: string
  trading_name: string
  cnpj: string
  cpf: string
  person_type: 'juridica' | 'fisica'
  email: string
  phone: string
  whatsapp: string
  contact_person: string
  
  // Endereço
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  
  // Dados bancários
  bank_name: string
  agency: string
  account: string
  pix_key: string
  
  notes: string
  is_active: boolean
}

export default function NovoFornecedorModal({
  isOpen,
  onClose,
  onSuccess,
  editData
}: NovoFornecedorModalProps) {
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState('dados')
  const [formData, setFormData] = useState<SupplierFormData>({
    company_name: '',
    trading_name: '',
    cnpj: '',
    cpf: '',
    person_type: 'juridica',
    email: '',
    phone: '',
    whatsapp: '',
    contact_person: '',
    
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    
    bank_name: '',
    agency: '',
    account: '',
    pix_key: '',
    
    notes: '',
    is_active: true
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        company_name: editData.company_name || '',
        trading_name: editData.trading_name || '',
        cnpj: editData.cnpj || '',
        cpf: editData.cpf || '',
        person_type: editData.person_type || 'juridica',
        email: editData.email || '',
        phone: editData.phone || '',
        whatsapp: editData.whatsapp || '',
        contact_person: editData.contact_person || '',
        
        cep: editData.cep || '',
        street: editData.street || '',
        number: editData.number || '',
        complement: editData.complement || '',
        neighborhood: editData.neighborhood || '',
        city: editData.city || '',
        state: editData.state || '',
        
        bank_name: editData.bank_name || '',
        agency: editData.agency || '',
        account: editData.account || '',
        pix_key: editData.pix_key || '',
        
        notes: editData.notes || '',
        is_active: editData.is_active ?? true
      })
    } else {
      // Reset form for new supplier
      setFormData({
        company_name: '',
        trading_name: '',
        cnpj: '',
        cpf: '',
        person_type: 'juridica',
        email: '',
        phone: '',
        whatsapp: '',
        contact_person: '',
        
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        
        bank_name: '',
        agency: '',
        account: '',
        pix_key: '',
        
        notes: '',
        is_active: true
      })
    }
  }, [editData])

  if (!isOpen) return null

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  const handleInputChange = (field: keyof SupplierFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supplierData = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      if (editData) {
        // Update existing supplier
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editData.id)

        if (error) throw error
      } else {
        // Create new supplier
        const { error } = await supabase
          .from('suppliers')
          .insert([{
            ...supplierData,
            created_at: new Date().toISOString()
          }])

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar fornecedor:', err)
      alert(`Erro ao ${editData ? 'atualizar' : 'criar'} fornecedor: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'dados', label: 'Dados Básicos', icon: Building2 },
    { id: 'endereco', label: 'Endereço', icon: MapPin },
    { id: 'bancarios', label: 'Dados Bancários', icon: CreditCard },
    { id: 'observacoes', label: 'Observações', icon: FileText }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editData ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <p className="text-sm text-gray-600">
                {editData ? 'Atualize as informações do fornecedor' : 'Cadastre um novo fornecedor no sistema'}
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

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    currentTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* Dados Básicos */}
            {currentTab === 'dados' && (
              <div className="space-y-6">
                {/* Tipo de Pessoa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Pessoa *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="radio"
                        id="juridica"
                        name="person_type"
                        value="juridica"
                        checked={formData.person_type === 'juridica'}
                        onChange={(e) => handleInputChange('person_type', e.target.value as 'juridica' | 'fisica')}
                        className="sr-only"
                      />
                      <label
                        htmlFor="juridica"
                        className={`block w-full p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.person_type === 'juridica'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-5 h-5" />
                          <span className="font-medium">Pessoa Jurídica</span>
                        </div>
                      </label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        id="fisica"
                        name="person_type"
                        value="fisica"
                        checked={formData.person_type === 'fisica'}
                        onChange={(e) => handleInputChange('person_type', e.target.value as 'juridica' | 'fisica')}
                        className="sr-only"
                      />
                      <label
                        htmlFor="fisica"
                        className={`block w-full p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.person_type === 'fisica'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5" />
                          <span className="font-medium">Pessoa Física</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome/Razão Social */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.person_type === 'juridica' ? 'Razão Social *' : 'Nome Completo *'}
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder={formData.person_type === 'juridica' ? 'Razão social da empresa' : 'Nome completo'}
                      required
                    />
                  </div>

                  {/* Nome Fantasia/Apelido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.person_type === 'juridica' ? 'Nome Fantasia' : 'Apelido'}
                    </label>
                    <input
                      type="text"
                      value={formData.trading_name}
                      onChange={(e) => handleInputChange('trading_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder={formData.person_type === 'juridica' ? 'Nome fantasia' : 'Como é conhecido'}
                    />
                  </div>

                  {/* CNPJ/CPF */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.person_type === 'juridica' ? 'CNPJ' : 'CPF'}
                    </label>
                    <input
                      type="text"
                      value={formData.person_type === 'juridica' ? formData.cnpj : formData.cpf}
                      onChange={(e) => handleInputChange(
                        formData.person_type === 'juridica' ? 'cnpj' : 'cpf', 
                        e.target.value
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder={formData.person_type === 'juridica' ? '00.000.000/0000-00' : '000.000.000-00'}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* Pessoa de Contato */}
                {formData.person_type === 'juridica' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pessoa de Contato
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => handleInputChange('contact_person', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="Nome da pessoa responsável"
                    />
                  </div>
                )}

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
                    Fornecedor ativo
                  </label>
                </div>
              </div>
            )}

            {/* Endereço */}
            {currentTab === 'endereco' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => handleInputChange('cep', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logradouro
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="Nome da rua, avenida, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => handleInputChange('number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.complement}
                      onChange={(e) => handleInputChange('complement', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="Apto, sala, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="Nome do bairro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="Nome da cidade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    >
                      <option value="">Selecione</option>
                      {brazilianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Dados Bancários */}
            {currentTab === 'bancarios' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banco
                    </label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="Nome do banco"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agência
                    </label>
                    <input
                      type="text"
                      value={formData.agency}
                      onChange={(e) => handleInputChange('agency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="0000-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conta
                    </label>
                    <input
                      type="text"
                      value={formData.account}
                      onChange={(e) => handleInputChange('account', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="00000-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      value={formData.pix_key}
                      onChange={(e) => handleInputChange('pix_key', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      placeholder="CPF, CNPJ, email ou telefone"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {currentTab === 'observacoes' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações Gerais
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    placeholder="Informações adicionais sobre o fornecedor..."
                  />
                </div>
              </div>
            )}
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
              {loading ? 'Salvando...' : (editData ? 'Atualizar' : 'Salvar')} Fornecedor
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}