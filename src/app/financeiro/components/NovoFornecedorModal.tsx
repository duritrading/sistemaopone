// src/app/financeiro/components/NovoFornecedorModal.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  X, 
  Save, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  CreditCard
} from 'lucide-react'

interface NovoFornecedorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
  onSuccess
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

  if (!isOpen) return null

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
      const { error } = await supabase
        .from('suppliers')
        .insert([{
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao criar fornecedor:', err)
      alert('Erro ao criar fornecedor: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2')
      .slice(0, 14)
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d)/, '$1-$2')
      .slice(0, 15)
  }

  const tabs = [
    { id: 'dados', label: 'Dados Gerais', icon: Building2 },
    { id: 'endereco', label: 'Endereço', icon: MapPin },
    { id: 'bancarios', label: 'Dados Bancários', icon: CreditCard },
    { id: 'observacoes', label: 'Observações', icon: FileText }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Novo Fornecedor</h2>
              <p className="text-sm text-gray-600">Cadastre um novo fornecedor no sistema</p>
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
            {/* Dados Gerais */}
            {currentTab === 'dados' && (
              <div className="space-y-6">
                {/* Tipo de Pessoa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Pessoa</label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => handleInputChange('person_type', 'juridica')}
                      className={`px-4 py-2 rounded-lg border ${
                        formData.person_type === 'juridica'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Pessoa Jurídica
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('person_type', 'fisica')}
                      className={`px-4 py-2 rounded-lg border ${
                        formData.person_type === 'fisica'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Pessoa Física
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Razão Social / Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.person_type === 'juridica' ? 'Razão Social' : 'Nome Completo'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    />
                  </div>

                  {/* Nome Fantasia */}
                  {formData.person_type === 'juridica' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome Fantasia</label>
                      <input
                        type="text"
                        value={formData.trading_name}
                        onChange={(e) => handleInputChange('trading_name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* CNPJ ou CPF */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.person_type === 'juridica' ? 'CNPJ' : 'CPF'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.person_type === 'juridica' ? formData.cnpj : formData.cpf}
                      onChange={(e) => {
                        const formatted = formData.person_type === 'juridica' 
                          ? formatCNPJ(e.target.value)
                          : formatCPF(e.target.value)
                        handleInputChange(formData.person_type === 'juridica' ? 'cnpj' : 'cpf', formatted)
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => handleInputChange('whatsapp', formatPhone(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                    />
                  </div>

                  {/* Pessoa de Contato */}
                  {formData.person_type === 'juridica' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pessoa de Contato</label>
                      <input
                        type="text"
                        value={formData.contact_person}
                        onChange={(e) => handleInputChange('contact_person', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Endereço */}
            {currentTab === 'endereco' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logradouro</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                  <input
                    type="text"
                    value={formData.complement}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="PR">Paraná</option>
                    {/* Adicionar outros estados conforme necessário */}
                  </select>
                </div>
              </div>
            )}

            {/* Dados Bancários */}
            {currentTab === 'bancarios' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banco</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agência</label>
                  <input
                    type="text"
                    value={formData.agency}
                    onChange={(e) => handleInputChange('agency', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
                  <input
                    type="text"
                    value={formData.account}
                    onChange={(e) => handleInputChange('account', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chave PIX</label>
                  <input
                    type="text"
                    value={formData.pix_key}
                    onChange={(e) => handleInputChange('pix_key', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                  />
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
                    placeholder="Informações adicionais sobre o fornecedor..."
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
                    <span className="ml-2 text-sm text-gray-700">Fornecedor ativo</span>
                  </label>
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
            {loading ? 'Salvando...' : 'Salvar Fornecedor'}
          </button>
        </div>
      </div>
    </div>
  )
}