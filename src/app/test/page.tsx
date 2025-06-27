'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function TestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('🔄 Testando conexão...\n')

    try {
      // 1. Verificar variáveis de ambiente
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        setResult(prev => prev + '❌ Variáveis de ambiente não encontradas!\n')
        setResult(prev => prev + `URL: ${url ? '✅' : '❌'}\n`)
        setResult(prev => prev + `KEY: ${key ? '✅' : '❌'}\n`)
        return
      }

      setResult(prev => prev + '✅ Variáveis de ambiente OK\n')
      setResult(prev => prev + `URL: ${url}\n`)

      // 2. Criar cliente Supabase
      const supabase = createClient(url, key)
      setResult(prev => prev + '✅ Cliente Supabase criado\n')

      // 3. Testar conexão básica
      const { data: session, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        setResult(prev => prev + `⚠️ Auth error (normal): ${authError.message}\n`)
      } else {
        setResult(prev => prev + '✅ Conexão auth OK\n')
      }

      // 4. Tentar listar tabelas
      setResult(prev => prev + '🔍 Testando query simples...\n')
      
      const { data, error } = await supabase
        .from('projects')
        .select('count', { count: 'exact' })
        .limit(1)

      if (error) {
        setResult(prev => prev + `❌ Erro na query: ${error.message}\n`)
        setResult(prev => prev + `Código: ${error.code}\n`)
        setResult(prev => prev + `Detalhes: ${error.details}\n`)
        setResult(prev => prev + `Hint: ${error.hint}\n`)
        
        if (error.code === 'PGRST116') {
          setResult(prev => prev + '💡 Solução: A tabela "projects" não existe!\n')
          setResult(prev => prev + '   Execute o SQL no Supabase Dashboard\n')
        }
      } else {
        setResult(prev => prev + '✅ Query funcionou!\n')
        setResult(prev => prev + `Dados: ${JSON.stringify(data)}\n`)
      }

      // 5. Testar se consegue acessar outras tabelas básicas
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('count', { count: 'exact' })
        .limit(1)

      if (clientsError) {
        setResult(prev => prev + `❌ Tabela clients: ${clientsError.message}\n`)
      } else {
        setResult(prev => prev + '✅ Tabela clients OK\n')
      }

    } catch (error: any) {
      setResult(prev => prev + `💥 Erro geral: ${error.message}\n`)
      setResult(prev => prev + `Stack: ${error.stack}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testSQL = async () => {
    setLoading(true)
    setResult('🔄 Testando SQL direto...\n')

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Testar SQL direto
      const { data, error } = await supabase.rpc('sql', {
        query: 'SELECT version();'
      })

      if (error) {
        setResult(prev => prev + `❌ RPC Error: ${error.message}\n`)
      } else {
        setResult(prev => prev + `✅ PostgreSQL Version: ${JSON.stringify(data)}\n`)
      }

    } catch (error: any) {
      setResult(prev => prev + `💥 Erro SQL: ${error.message}\n`)
    } finally {
      setLoading(false)
    }
  }

  const clearResult = () => setResult('')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Teste de Conexão Supabase</h1>
          <p className="text-gray-600">Diagnóstico completo da conexão com o banco</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              {loading ? '🔄 Testando...' : '🧪 Testar Conexão'}
            </button>
            
            <button
              onClick={clearResult}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              🗑️ Limpar
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
            {result || '💭 Clique em "Testar Conexão" para começar...'}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-4">📋 Checklist de Verificação</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-700 mb-2">1. Variáveis de Ambiente</h4>
              <ul className="text-blue-600 text-sm space-y-1">
                <li>□ NEXT_PUBLIC_SUPABASE_URL</li>
                <li>□ NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                <li>□ Arquivo .env.local na raiz</li>
                <li>□ Servidor reiniciado</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-blue-700 mb-2">2. Supabase Setup</h4>
              <ul className="text-blue-600 text-sm space-y-1">
                <li>□ Projeto criado no Supabase</li>
                <li>□ SQL executado no Dashboard</li>
                <li>□ Tabelas criadas</li>
                <li>□ RLS configurado ou desabilitado</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded border">
            <h4 className="font-medium text-gray-800 mb-2">🔧 Problemas Comuns:</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li><strong>PGRST116:</strong> Tabela não existe → Execute o SQL</li>
              <li><strong>Authentication required:</strong> RLS ativo → Desabilite temporariamente</li>
              <li><strong>Invalid API key:</strong> Chave incorreta → Verifique .env.local</li>
              <li><strong>Connection refused:</strong> URL incorreta → Verifique projeto Supabase</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <a 
            href="/projetos"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            📊 Ir para Projetos
          </a>
          <a 
            href="/debug"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            🔍 Página Debug Completa
          </a>
        </div>
      </div>
    </div>
  )
}