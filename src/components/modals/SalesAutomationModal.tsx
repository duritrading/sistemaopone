// src/components/modals/SalesAutomationModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Settings, Users, DollarSign, User, CheckCircle, X, Save } from 'lucide-react'

interface SalesAutomationModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AutomationSettings {
  autoCreateClient: boolean
  defaultRelationshipStatus: 'Ativo' | 'Renovação'
  defaultAccountHealth: 'Excelente' | 'Saudável'
  calculateMRR: boolean
  mrrMonths: number
  createPrimaryContact: boolean
  createInitialInteraction: boolean
}

export default function SalesAutomationModal({ isOpen, onClose }: SalesAutomationModalProps) {
  const [settings, setSettings] = useState<AutomationSettings>({
    autoCreateClient: true,
    defaultRelationshipStatus: 'Ativo',
    defaultAccountHealth: 'Saudável',
    calculateMRR: true,
    mrrMonths: 12,
    createPrimaryContact: true,
    createInitialInteraction: true
  })

  const [saving, setSaving] = useState(false)

  // Carregar configurações ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('salesAutomationSettings')
        if (saved) {
          setSettings(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      // Salvar configurações no localStorage
      localStorage.setItem('salesAutomationSettings', JSON.stringify(settings))
      
      // Feedback visual
      alert('✅ Configurações de automação salvas com sucesso!\n\nAs configurações serão aplicadas nas próximas oportunidades movidas para "Contrato Assinado".')
      onClose()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('❌ Erro ao salvar configurações. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      setSettings({
        autoCreateClient: true,
        defaultRelationshipStatus: 'Ativo',
        defaultAccountHealth: 'Saudável',
        calculateMRR: true,
        mrrMonths: 12,
        createPrimaryContact: true,
        createInitialInteraction: true
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Automação de Vendas</h2>
              <p className="text-sm text-gray-600">Configure como oportunidades viram clientes automaticamente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Configuração Principal */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Automação Principal</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <input
                  type="checkbox"
                  id="autoCreate"
                  checked={settings.autoCreateClient}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoCreateClient: e.target.checked }))}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500 mt-1"
                />
                <label htmlFor="autoCreate" className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Criar cliente automaticamente
                  </div>
                  <div className="text-sm text-gray-600">
                    Quando uma oportunidade for movida para "Contrato Assinado", criar automaticamente um cliente na aba de Clientes
                  </div>
                </label>
              </div>

              {!settings.autoCreateClient && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 text-yellow-600">⚠️</div>
                    <div>
                      <div className="text-sm font-medium text-yellow-800">Automação desabilitada</div>
                      <div className="text-sm text-yellow-700">
                        Você precisará criar clientes manualmente quando fechar oportunidades
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Configurações do Cliente */}
          {settings.autoCreateClient && (
            <>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Configurações do Cliente</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status de Relacionamento Padrão
                    </label>
                    <select
                      value={settings.defaultRelationshipStatus}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        defaultRelationshipStatus: e.target.value as 'Ativo' | 'Renovação'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Renovação">Renovação</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Como classificar o novo cliente</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saúde da Conta Padrão
                    </label>
                    <select
                      value={settings.defaultAccountHealth}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        defaultAccountHealth: e.target.value as 'Excelente' | 'Saudável'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Excelente">Excelente</option>
                      <option value="Saudável">Saudável</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Condição inicial da conta</p>
                  </div>
                </div>
              </div>

              {/* Configurações Financeiras */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900">Configurações Financeiras</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="calculateMRR"
                      checked={settings.calculateMRR}
                      onChange={(e) => setSettings(prev => ({ ...prev, calculateMRR: e.target.checked }))}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500 mt-1"
                    />
                    <label htmlFor="calculateMRR" className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Calcular MRR automaticamente
                      </div>
                      <div className="text-sm text-gray-600">
                        Dividir o valor total do contrato para calcular a receita recorrente mensal
                      </div>
                    </label>
                  </div>

                  {settings.calculateMRR && (
                    <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dividir por quantos meses?
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="36"
                          value={settings.mrrMonths}
                          onChange={(e) => setSettings(prev => ({ ...prev, mrrMonths: parseInt(e.target.value) || 12 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Padrão: 12 meses (anual)
                        </p>
                      </div>
                      <div className="flex items-end">
                        <div className="p-3 bg-green-50 rounded-lg w-full">
                          <div className="text-xs text-green-700 font-medium">Exemplo de Cálculo:</div>
                          <div className="text-sm text-green-800">
                            R$ 120.000 ÷ {settings.mrrMonths} = R$ {(120000 / settings.mrrMonths).toLocaleString('pt-BR')} MRR
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Configurações de Contato */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900">Dados de Contato</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="createContact"
                      checked={settings.createPrimaryContact}
                      onChange={(e) => setSettings(prev => ({ ...prev, createPrimaryContact: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 mt-1"
                    />
                    <label htmlFor="createContact" className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Criar contato principal
                      </div>
                      <div className="text-sm text-gray-600">
                        Transferir dados do contato da oportunidade para o cliente
                      </div>
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="createInteraction"
                      checked={settings.createInitialInteraction}
                      onChange={(e) => setSettings(prev => ({ ...prev, createInitialInteraction: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 mt-1"
                    />
                    <label htmlFor="createInteraction" className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Criar interação inicial
                      </div>
                      <div className="text-sm text-gray-600">
                        Registrar automaticamente a conversão da oportunidade
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview das Configurações */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Resumo da Automação
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>✅ Cliente será criado como: <strong>{settings.defaultRelationshipStatus}</strong> | <strong>{settings.defaultAccountHealth}</strong></p>
                  {settings.calculateMRR && (
                    <p>💰 MRR será calculado dividindo o valor total por <strong>{settings.mrrMonths} meses</strong></p>
                  )}
                  {settings.createPrimaryContact && (
                    <p>👤 Contato principal será transferido da oportunidade</p>
                  )}
                  {settings.createInitialInteraction && (
                    <p>📝 Interação inicial será criada registrando a conversão</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Restaurar padrões
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}