// src/app/financeiro/components/BankReconciliation.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Upload, Check, X, AlertCircle, RefreshCw, ArrowRight,
  FileText, DollarSign, Calendar, Building2, CheckCircle2
} from 'lucide-react'
import { useToast } from './Toast'
import { Transaction, Account } from '../types/financial'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface BankStatement {
  id: string
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  balance: number
  reference?: string
}

interface ReconciliationMatch {
  bankStatement: BankStatement
  transaction?: Transaction
  confidence: number
  status: 'matched' | 'unmatched' | 'conflict'
}

interface BankReconciliationProps {
  account: Account
  onClose: () => void
}

export function BankReconciliation({ account, onClose }: BankReconciliationProps) {
  const [bankStatements, setBankStatements] = useState<BankStatement[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [matches, setMatches] = useState<ReconciliationMatch[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadTransactions()
  }, [selectedPeriod])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('account_id', account.id)
        .gte('transaction_date', selectedPeriod.start)
        .lte('transaction_date', selectedPeriod.end)
        .order('transaction_date', { ascending: true })

      if (error) throw error

      setTransactions(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar transações:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar transações'
      })
    } finally {
      setLoading(false)
    }
  }

  const parseBankStatementCSV = (csvContent: string): BankStatement[] => {
    const lines = csvContent.split('\n')
    const statements: BankStatement[] = []

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const columns = line.split(',').map(col => col.replace(/"/g, '').trim())
      
      if (columns.length >= 4) {
        try {
          const statement: BankStatement = {
            id: `stmt-${i}`,
            date: columns[0],
            description: columns[1],
            amount: Math.abs(parseFloat(columns[2]) || 0),
            type: parseFloat(columns[2]) > 0 ? 'credit' : 'debit',
            balance: parseFloat(columns[3]) || 0,
            reference: columns[4] || undefined
          }
          statements.push(statement)
        } catch (err) {
          console.warn(`Erro ao processar linha ${i}:`, line)
        }
      }
    }

    return statements
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      showToast({
        type: 'error',
        title: 'Formato inválido',
        message: 'Por favor, faça upload de um arquivo CSV'
      })
      return
    }

    try {
      setLoading(true)
      
      const text = await file.text()
      const statements = parseBankStatementCSV(text)
      
      if (statements.length === 0) {
        showToast({
          type: 'warning',
          title: 'Arquivo vazio',
          message: 'Nenhuma transação encontrada no arquivo'
        })
        return
      }

      setBankStatements(statements)
      await performAutoReconciliation(statements)

      showToast({
        type: 'success',
        title: 'Extrato importado',
        message: `${statements.length} transações importadas do extrato bancário`
      })
    } catch (err: any) {
      console.error('Erro ao processar arquivo:', err)
      showToast({
        type: 'error',
        title: 'Erro na importação',
        message: 'Erro ao processar arquivo CSV'
      })
    } finally {
      setLoading(false)
    }
  }

  const performAutoReconciliation = async (statements: BankStatement[]) => {
    const reconciliationMatches: ReconciliationMatch[] = []

    for (const statement of statements) {
      let bestMatch: Transaction | undefined
      let bestConfidence = 0

      for (const transaction of transactions) {
        const confidence = calculateMatchConfidence(statement, transaction)
        
        if (confidence > bestConfidence && confidence >= 0.7) {
          bestMatch = transaction
          bestConfidence = confidence
        }
      }

      reconciliationMatches.push({
        bankStatement: statement,
        transaction: bestMatch,
        confidence: bestConfidence,
        status: bestMatch ? 'matched' : 'unmatched'
      })
    }

    setMatches(reconciliationMatches)
  }

  const calculateMatchConfidence = (statement: BankStatement, transaction: Transaction): number => {
    let confidence = 0

    // Match amount (40% weight)
    if (Math.abs(statement.amount - transaction.amount) < 0.01) {
      confidence += 0.4
    } else if (Math.abs(statement.amount - transaction.amount) < 10) {
      confidence += 0.2
    }

    // Match date (30% weight)
    const stmtDate = new Date(statement.date)
    const txnDate = new Date(transaction.transaction_date)
    const daysDiff = Math.abs((stmtDate.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0) {
      confidence += 0.3
    } else if (daysDiff <= 2) {
      confidence += 0.2
    } else if (daysDiff <= 7) {
      confidence += 0.1
    }

    // Match description (30% weight)
    const descSimilarity = calculateStringSimilarity(
      statement.description.toLowerCase(),
      transaction.description.toLowerCase()
    )
    confidence += descSimilarity * 0.3

    return confidence
  }

  const calculateStringSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  const confirmMatch = async (matchIndex: number) => {
    const match = matches[matchIndex]
    if (!match.transaction) return

    try {
      setReconciling(true)

      // Update transaction status to reconciled
      const { error } = await supabase
        .from('financial_transactions')
        .update({ 
          status: match.transaction.type === 'receita' ? 'recebido' : 'pago',
          payment_date: match.bankStatement.date,
          reconciled: true,
          bank_reference: match.bankStatement.reference
        })
        .eq('id', match.transaction.id)

      if (error) throw error

      // Update local state
      setMatches(prev => prev.map((m, i) => 
        i === matchIndex ? { ...m, status: 'matched' as const } : m
      ))

      showToast({
        type: 'success',
        title: 'Conciliação confirmada',
        message: 'Transação conciliada com sucesso'
      })
    } catch (err: any) {
      console.error('Erro ao confirmar conciliação:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao confirmar conciliação'
      })
    } finally {
      setReconciling(false)
    }
  }

  const rejectMatch = (matchIndex: number) => {
    setMatches(prev => prev.map((m, i) => 
      i === matchIndex ? { ...m, transaction: undefined, status: 'unmatched' as const } : m
    ))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getMatchedCount = () => matches.filter(m => m.status === 'matched').length
  const getUnmatchedCount = () => matches.filter(m => m.status === 'unmatched').length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Conciliação Bancária</h2>
              <p className="text-sm text-gray-500">{account.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={selectedPeriod.start}
                    onChange={(e) => setSelectedPeriod(prev => ({ ...prev, start: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <span className="text-gray-500">até</span>
                  <input
                    type="date"
                    value={selectedPeriod.end}
                    onChange={(e) => setSelectedPeriod(prev => ({ ...prev, end: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extrato Bancário</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="bankStatementUpload"
                  />
                  <label
                    htmlFor="bankStatementUpload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importar CSV
                  </label>
                </div>
              </div>
            </div>

            {bankStatements.length > 0 && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{getMatchedCount()} conciliadas</span>
                </div>
                <div className="flex items-center space-x-2 text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{getUnmatchedCount()} pendentes</span>
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processando...</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {bankStatements.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum extrato importado</h3>
                <p className="text-gray-500 mb-4">
                  Faça upload do extrato bancário em formato CSV para iniciar a conciliação
                </p>
                <label
                  htmlFor="bankStatementUpload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Extrato
                </label>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-6 space-y-4">
                {matches.map((match, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      match.status === 'matched' 
                        ? 'border-green-200 bg-green-50' 
                        : match.status === 'unmatched'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Bank Statement */}
                      <div className="flex-1 pr-4">
                        <h4 className="font-medium text-gray-900 mb-1">Extrato Bancário</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{match.bankStatement.description}</p>
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(match.bankStatement.date)}</span>
                            </span>
                            <span className={`flex items-center space-x-1 font-medium ${
                              match.bankStatement.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              <DollarSign className="w-3 h-3" />
                              <span>
                                {match.bankStatement.type === 'credit' ? '+' : '-'}
                                {formatCurrency(match.bankStatement.amount)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="px-4">
                        <ArrowRight className={`w-5 h-5 ${
                          match.status === 'matched' ? 'text-green-500' : 'text-gray-400'
                        }`} />
                      </div>

                      {/* Transaction */}
                      <div className="flex-1 pl-4">
                        {match.transaction ? (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Sistema</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>{match.transaction.description}</p>
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(match.transaction.transaction_date)}</span>
                                </span>
                                <span className={`flex items-center space-x-1 font-medium ${
                                  match.transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  <DollarSign className="w-3 h-3" />
                                  <span>
                                    {match.transaction.type === 'receita' ? '+' : '-'}
                                    {formatCurrency(match.transaction.amount)}
                                  </span>
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Confiança: {(match.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">Nenhuma correspondência encontrada</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {match.status === 'unmatched' && match.transaction && (
                          <>
                            <button
                              onClick={() => confirmMatch(index)}
                              disabled={reconciling}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                              title="Confirmar conciliação"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rejectMatch(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Rejeitar correspondência"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {match.status === 'matched' && (
                          <div className="p-2 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {bankStatements.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {getMatchedCount()} de {matches.length} transações conciliadas
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200"
                >
                  Fechar
                </button>
                <button
                  onClick={loadTransactions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Atualizar Dados
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}