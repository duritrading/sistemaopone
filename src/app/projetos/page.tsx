// src/app/projetos/page.tsx - VERSÃO COM CARREGAMENTO MANUAL
'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  // Função para carregar projetos - APENAS quando clicado
  const handleLoadProjects = async () => {
    // Prevenir múltiplos cliques
    if (loading) return
    
    setLoading(true)
    setError('')
    setDebugInfo('Iniciando...')
    
    try {
      // Step 1: Verificar variáveis
      setDebugInfo('Verificando variáveis de ambiente...')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL não definida')
      }
      if (!supabaseKey) {
        throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não definida')
      }

      // Step 2: Criar cliente
      setDebugInfo('Criando cliente Supabase...')
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Step 3: Testar conexão simples primeiro
      setDebugInfo('Testando conexão básica...')
      const { data: testData, error: testError } = await supabase
        .from('projects')
        .select('count', { count: 'exact' })
        .limit(1)

      if (testError) {
        throw new Error(`Erro de conexão: ${testError.message}`)
      }

      // Step 4: Buscar dados reais
      setDebugInfo('Buscando projetos...')
      const { data, error: dataError } = await supabase
        .from('projects')
        .select('id, name, status, health, progress_percentage, description')
        .eq('is_active', true)
        .order('name')
        .limit(20)

      if (dataError) {
        throw new Error(`Erro ao buscar dados: ${dataError.message}`)
      }

      setProjects(data || [])
      setDebugInfo(`Sucesso! ${data?.length || 0} projetos carregados`)
      
    } catch (err) {
      console.error('Erro completo:', err)
      setError(err.message || 'Erro desconhecido')
      setDebugInfo(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = () => {
    setProjects([])
    setError('')
    setDebugInfo('Dados limpos')
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        📊 Gestão de Projetos (Versão Manual)
      </h1>

      {/* Controles */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <button 
          onClick={handleLoadProjects}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: loading ? '#6c757d' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {loading ? '🔄 Carregando...' : '📥 Carregar Projetos'}
        </button>

        <button 
          onClick={handleClearAll}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🗑️ Limpar
        </button>
      </div>

      {/* Status */}
      <div style={{ 
        padding: '15px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <strong>Status:</strong> {debugInfo || 'Aguardando ação do usuário'}
        <br />
        <strong>Projetos carregados:</strong> {projects.length}
        <br />
        <strong>Último carregamento:</strong> {projects.length > 0 ? new Date().toLocaleTimeString() : 'Nunca'}
      </div>

      {/* Erro */}
      {error && (
        <div style={{ 
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#721c24'
        }}>
          <strong>❌ Erro:</strong> {error}
          
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer' }}>🔧 Soluções possíveis</summary>
            <ul style={{ marginTop: '10px', fontSize: '14px' }}>
              <li>Verifique se o arquivo .env.local existe na raiz do projeto</li>
              <li>Verifique se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão corretas</li>
              <li>Reinicie o servidor: npm run dev</li>
              <li>Verifique se a tabela 'projects' existe no Supabase</li>
              <li>Abra o Console (F12) para mais detalhes</li>
            </ul>
          </details>
        </div>
      )}

      {/* Lista de Projetos */}
      {projects.length > 0 && (
        <div>
          <h2 style={{ color: '#333', marginBottom: '15px' }}>
            📋 Lista de Projetos ({projects.length})
          </h2>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            {projects.map((project, index) => (
              <div 
                key={project.id || index}
                style={{ 
                  padding: '20px', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onClick={() => {
                  if (project.id) {
                    window.location.href = `/projetos/${project.id}`
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ 
                      margin: '0 0 8px 0', 
                      color: '#007bff',
                      fontSize: '18px'
                    }}>
                      {project.name || 'Nome não disponível'}
                    </h3>
                    
                    {project.description && (
                      <p style={{ 
                        margin: '0 0 12px 0', 
                        color: '#666',
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {project.description.length > 100 
                          ? project.description.substring(0, 100) + '...'
                          : project.description
                        }
                      </p>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: 
                        project.health === 'critical' ? '#f8d7da' :
                        project.health === 'warning' ? '#fff3cd' : '#d4edda',
                      color:
                        project.health === 'critical' ? '#721c24' :
                        project.health === 'warning' ? '#856404' : '#155724'
                    }}>
                      {project.health || 'N/A'}
                    </span>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  marginTop: '12px',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  <span>
                    <strong>Status:</strong> {project.status || 'N/A'}
                  </span>
                  <span>
                    <strong>Progresso:</strong> {project.progress_percentage || 0}%
                  </span>
                  <span>
                    <strong>ID:</strong> {project.id || 'N/A'}
                  </span>
                </div>

                {/* Barra de progresso */}
                <div style={{ 
                  marginTop: '12px',
                  height: '6px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${project.progress_percentage || 0}%`,
                    backgroundColor: '#007bff',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instruções */}
      {projects.length === 0 && !loading && !error && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          border: '2px dashed #dee2e6',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>
            👆 Clique em "Carregar Projetos" para começar
          </h3>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>
            Esta versão não carrega automaticamente para evitar loops infinitos
          </p>
        </div>
      )}
    </div>
  )
}