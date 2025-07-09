// src/app/financeiro/gestao/components/FornecedoresManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Building, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  MoreHorizontal,
  X,
  Save,
  Building2
} from 'lucide-react'

interface Supplier {
  id: string
  company_name: string
  trading_name?: string
  cnpj?: string
  cpf?: string
  person_type: 'juridica' | 'fisica'
  email?: string
  phone?: string
  whatsapp?: string
  contact_person?: string
  city?: string
  state?: string
  is_active: boolean
  created_at: string
}

interface FornecedoresManagerProps {
  onUpdate: () => void
}

export default function FornecedoresManager({ onUpdate }: FornecedoresManagerProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [personTypeFilter, setPersonTypeFilter] = useState<'all' | 'juridica' | 'fisica'>('all')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('company_name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.trading_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && supplier.is_active) ||
                         (statusFilter === 'inactive' && !supplier.is_active)
    
    const matchesPersonType = personTypeFilter === 'all' || supplier.person_type === personTypeFilter

    return matchesSearch && matchesStatus && matchesPersonType
  })

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: !supplier.is_active })
        .eq('id', supplier.id)

      if (error) throw error

      await loadSuppliers()
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do fornecedor')
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Tem certeza que deseja excluir o fornecedor "${supplier.company_name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplier.id)

      if (error) throw error

      await loadSuppliers()
      onUpdate()
      alert('Fornecedor excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error)
      alert('Erro ao excluir fornecedor. Verifique se não há transações vinculadas.')
    }
  }

  const formatDocument = (supplier: Supplier) => {
    if (supplier.person_type === 'juridica' && supplier.cnpj) {
      return supplier.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    if (supplier.person_type === 'fisica' && supplier.cpf) {
      return supplier.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return 'Não informado'
  }

  const getPersonTypeLabel = (type: string) => {
    return type === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="active">Apenas ativos</option>
            <option value="inactive">Apenas inativos</option>
          </select>

          <select
            value={personTypeFilter}
            onChange={(e) => setPersonTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="juridica">Pessoa Jurídica</option>
            <option value="fisica">Pessoa Física</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          {filteredSuppliers.length} de {suppliers.length} fornecedores
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.company_name}
                        </div>
                        {supplier.trading_name && (
                          <div className="text-sm text-gray-500">
                            {supplier.trading_name}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {getPersonTypeLabel(supplier.person_type)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDocument(supplier)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {supplier.contact_person && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-400" />
                          {supplier.contact_person}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center text-gray-500">
                          <Mail className="w-4 h-4 mr-1" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center text-gray-500">
                          <Phone className="w-4 h-4 mr-1" />
                          {supplier.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.city && supplier.state ? (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {supplier.city}, {supplier.state}
                      </div>
                    ) : (
                      'Não informado'
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(supplier)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplier.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {supplier.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSupplier(supplier)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedSupplier(supplier)
                          setShowEditModal(true)
                        }}
                        className="text-yellow-600 hover:text-yellow-900 p-1"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum fornecedor encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro fornecedor.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetailsModal && selectedSupplier && (
        <SupplierDetailsModal
          supplier={selectedSupplier}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedSupplier(null)
          }}
        />
      )}

      {showEditModal && selectedSupplier && (
        <SupplierEditModal
          supplier={selectedSupplier}
          onClose={() => {
            setShowEditModal(false)
            setSelectedSupplier(null)
          }}
          onSuccess={() => {
            loadSuppliers()
            onUpdate()
            setShowEditModal(false)
            setSelectedSupplier(null)
          }}
        />
      )}
    </div>
  )
}

// Modal de detalhes (placeholder)
function SupplierDetailsModal({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Detalhes do Fornecedor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p>Modal de detalhes para: {supplier.company_name}</p>
          {/* Implementar detalhes completos */}
        </div>
      </div>
    </div>
  )
}

// Modal de edição (placeholder)
function SupplierEditModal({ 
  supplier, 
  onClose, 
  onSuccess 
}: { 
  supplier: Supplier
  onClose: () => void
  onSuccess: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Editar Fornecedor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p>Modal de edição para: {supplier.company_name}</p>
          {/* Implementar formulário de edição */}
        </div>
      </div>
    </div>
  )
}