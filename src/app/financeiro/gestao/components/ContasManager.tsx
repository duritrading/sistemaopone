// src/app/financeiro/gestao/components/ContasManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  CreditCard, 
  Search, 
  Edit,
  Trash2,
  Eye,
  DollarSign,
  TrendingUp,
  Building,
  X
} from 'lucide-react'

interface ContasManagerProps {
  onUpdate: () => void
}

export default function ContasManager({ onUpdate }: ContasManagerProps) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'conta_corrente' | 'conta_poupanca' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'investimento' | 'outros'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name')

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.bank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.account_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || account.type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && account.is_active) ||
                         (statusFilter === 'inactive' && !account.is_active)

    return matchesSearch && matchesType && matchesStatus
  })

  const toggleStatus = async (account: any) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: !account.is_active })
        .eq('id', account.id)

      if (error) throw error
      await loadAccounts()
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status da conta')
    }
  }

  const handleDelete = async (account: any) => {
    if (!confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
      return
    }

    try {
      // Verificar se há transações vinculadas
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('id')
        .eq('account_id', account.id)
        .limit(1)

      if (transactions && transactions.length > 0) {
        alert('Não é possível excluir esta conta pois há transações vinculadas a ela.')
        return
      }

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', account.id)

      if (error) throw error

      await loadAccounts()
      onUpdate()
      alert('Conta excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      alert('Erro ao excluir conta.')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getAccountTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'conta_corrente': CreditCard,
      'conta_poupanca': DollarSign,
      'cartao_credito': CreditCard,
      'cartao_debito': CreditCard,
      'dinheiro': DollarSign,
      'investimento': TrendingUp,
      'outros': CreditCard
    }
    const IconComponent = iconMap[type] || CreditCard
    return <IconComponent className="w-5 h-5" />
  }

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'conta_corrente': 'Conta Corrente',
      'conta_poupanca': 'Conta Poupança', 
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'dinheiro': 'Dinheiro',
      'investimento': 'Investimento',
      'outros': 'Outros'
    }
    return labels[type] || type
  }

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'conta_corrente': 'bg-blue-100 text-blue-800',
      'conta_poupanca': 'bg-green-100 text-green-800',
      'cartao_credito': 'bg-red-100 text-red-800',
      'cartao_debito': 'bg-purple-100 text-purple-800',
      'dinheiro': 'bg-yellow-100 text-yellow-800',
      'investimento': 'bg-indigo-100 text-indigo-800',
      'outros': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600'
    if (balance < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const maskCardNumber = (cardNumber?: string) => {
    if (!cardNumber) return null
    return cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '**** **** **** $4')
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
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar contas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="conta_corrente">Conta Corrente</option>
            <option value="conta_poupanca">Conta Poupança</option>
            <option value="cartao_credito">Cartão de Crédito</option>
            <option value="cartao_debito">Cartão de Débito</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="investimento">Investimento</option>
            <option value="outros">Outros</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="active">Apenas ativas</option>
            <option value="inactive">Apenas inativas</option>
          </select>
        </div>

        <div className="text-sm text-gray-700">
          {filteredAccounts.length} de {accounts.length} contas
        </div>
      </div>

      {/* Accounts Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Saldo Total</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Contas Ativas</p>
              <p className="text-lg font-semibold text-gray-900">
                {accounts.filter(acc => acc.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Cartões</p>
              <p className="text-lg font-semibold text-gray-900">
                {accounts.filter(acc => acc.type.includes('cartao')).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Bancos</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Set(accounts.filter(acc => acc.bank).map(acc => acc.bank)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg border border-gray-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Conta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Banco
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Dados Bancários
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {getAccountTypeIcon(account.type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {account.name}
                        </div>
                        {account.card_number && (
                          <div className="text-xs text-gray-500">
                            {maskCardNumber(account.card_number)}
                          </div>
                        )}
                        {account.account_number && (
                          <div className="text-xs text-gray-500">
                            Conta: {account.account_number}-{account.account_digit}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountTypeColor(account.type)}`}>
                      {getAccountTypeLabel(account.type)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.bank ? (
                      <div>
                        <div className="font-medium">{account.bank}</div>
                        {account.bank_code && (
                          <div className="text-xs text-gray-500">Código: {account.bank_code}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">Não informado</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {account.agency && (
                        <div className="text-xs">Agência: {account.agency}</div>
                      )}
                      {account.pix_key && (
                        <div className="text-xs text-blue-600">
                          PIX: {account.pix_key.substring(0, 15)}...
                        </div>
                      )}
                      {account.card_limit && (
                        <div className="text-xs text-purple-600">
                          Limite: {formatCurrency(account.card_limit)}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-sm font-semibold ${getBalanceColor(account.balance || 0)}`}>
                      {formatCurrency(account.balance || 0)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(account)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {account.is_active ? 'Ativa' : 'Inativa'}
                    </button>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedAccount(account)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button className="text-yellow-600 hover:text-yellow-900 p-1" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(account)}
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

        {filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conta encontrada</h3>
            <p className="mt-1 text-sm text-gray-600">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira conta.'}
            </p>
          </div>
        )}
      </div>

      {/* Account Details Modal */}
      {showDetailsModal && selectedAccount && (
        <AccountDetailsModal
          account={selectedAccount}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedAccount(null)
          }}
        />
      )}
    </div>
  )
}

// Modal de detalhes da conta
function AccountDetailsModal({ account, onClose }: { account: any; onClose: () => void }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getAccountTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'conta_corrente': CreditCard,
      'conta_poupanca': DollarSign,
      'cartao_credito': CreditCard,
      'cartao_debito': CreditCard,
      'dinheiro': DollarSign,
      'investimento': TrendingUp,
      'outros': CreditCard
    }
    const IconComponent = iconMap[type] || CreditCard
    return <IconComponent className="w-6 h-6" />
  }

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'conta_corrente': 'Conta Corrente',
      'conta_poupanca': 'Conta Poupança',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'dinheiro': 'Dinheiro',
      'investimento': 'Investimento',
      'outros': 'Outros'
    }
    return labels[type] || type
  }

  const maskCardNumber = (cardNumber?: string) => {
    if (!cardNumber) return 'Não informado'
    return cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4')
  }

  const getPixTypeLabel = (pixType?: string) => {
    const labels: Record<string, string> = {
      'cpf': 'CPF',
      'cnpj': 'CNPJ',
      'email': 'E-mail',
      'telefone': 'Telefone',
      'chave_aleatoria': 'Chave Aleatória'
    }
    return pixType ? labels[pixType] || pixType : 'Não informado'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              {getAccountTypeIcon(account.type)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{account.name}</h2>
              <p className="text-sm text-gray-600">{getAccountTypeLabel(account.type)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações Básicas */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo da Conta</label>
                    <span className="text-sm text-gray-900">{getAccountTypeLabel(account.type)}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Atual</label>
                    <span className={`text-lg font-semibold ${
                      (account.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(account.balance || 0)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {account.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>

                  {account.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {account.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dados Bancários */}
              {(account.bank || account.agency || account.account_number) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Bancários</h3>
                  
                  <div className="space-y-3">
                    {account.bank && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                        <span className="text-sm text-gray-900">{account.bank}</span>
                        {account.bank_code && (
                          <span className="text-xs text-gray-500 ml-2">(Código: {account.bank_code})</span>
                        )}
                      </div>
                    )}

                    {account.agency && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                        <span className="text-sm text-gray-900">{account.agency}</span>
                      </div>
                    )}

                    {account.account_number && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número da Conta</label>
                        <span className="text-sm text-gray-900">
                          {account.account_number}{account.account_digit && `-${account.account_digit}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dados do Cartão e PIX */}
            <div className="space-y-6">
              {/* Dados do Cartão */}
              {(account.card_number || account.card_limit) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Cartão</h3>
                  
                  <div className="space-y-3">
                    {account.card_number && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número do Cartão</label>
                        <span className="text-sm text-gray-900 font-mono">
                          {maskCardNumber(account.card_number)}
                        </span>
                      </div>
                    )}

                    {account.card_holder_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Portador</label>
                        <span className="text-sm text-gray-900">{account.card_holder_name}</span>
                      </div>
                    )}

                    {account.card_expiry && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                        <span className="text-sm text-gray-900">{account.card_expiry}</span>
                      </div>
                    )}

                    {account.card_limit && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Limite</label>
                        <span className="text-sm text-gray-900 font-semibold text-purple-600">
                          {formatCurrency(account.card_limit)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dados PIX */}
              {account.pix_key && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados PIX</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo da Chave</label>
                      <span className="text-sm text-gray-900">{getPixTypeLabel(account.pix_type)}</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
                      <span className="text-sm text-gray-900 bg-blue-50 p-2 rounded border font-mono">
                        {account.pix_key}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Informações de Auditoria */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Sistema</h3>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div>
                    <label className="block font-medium mb-1">Criado em</label>
                    <span>{new Date(account.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Atualizado em</label>
                    <span>{new Date(account.updated_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}