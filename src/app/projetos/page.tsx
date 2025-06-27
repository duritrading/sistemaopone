// src/app/projetos/page.tsx - VERSÃO ULTRA-BÁSICA
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      console.log('🔍 Iniciando carregamento...')
      
      // Verificar variáveis de ambiente
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variáveis de ambiente do Supabase não configuradas')
      }

      console.log('✅ Variáveis de ambiente OK')
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      console.log('🔍 Buscando projetos...')
      
      const { data, error: supabaseError } = await supabase
        .from('projects')
        .select('id, name, status, health, progress_percentage')
        .eq('is_active', true)
        .limit(10)

      if (supabaseError) {
        console.error('❌ Erro Supabase:', supabaseError)
        throw new Error(`Erro do banco: ${supabaseError.message}`)
      }

      console.log('✅ Projetos carregados:', data?.length || 0)
      setProjects(data || [])
      
    } catch (err) {
      console.error('💥 Erro geral:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Gestão de Projetos</h1>
        <p>Carregando...</p>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 2s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>❌ Erro</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button 
          onClick={loadProjects}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#3498db', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Tentar Novamente
        </button>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
          <h3>🔧 Verificações:</h3>
          <ul>
            <li>✅ Servidor Next.js rodando</li>
            <li>🔍 Variáveis .env.local configuradas?</li>
            <li>🔍 Supabase acessível?</li>
            <li>🔍 Tabela 'projects' existe?</li>
          </ul>
          
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Abra o Console (F12) para mais detalhes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>📊 Gestão de Projetos</h1>
      <p>Total: {projects.length} projetos</p>
      
      <button 
        onClick={loadProjects}
        style={{ 
          padding: '8px 16px', 
          backgroundColor: '#28a745', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        🔄 Atualizar
      </button>

      {projects.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <h3>📂 Nenhum projeto encontrado</h3>
          <p>Crie seu primeiro projeto ou verifique os filtros</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {projects.map((project) => (
            <div 
              key={project.id}
              style={{ 
                padding: '16px', 
                border: '1px solid #dee2e6', 
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer'
              }}
              onClick={() => {
                window.location.href = `/projetos/${project.id}`
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
                {project.name}
              </h3>
              
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                fontSize: '14px', 
                color: '#666' 
              }}>
                <span>
                  Status: <strong>{project.status}</strong>
                </span>
                <span>
                  Saúde: <strong style={{ 
                    color: project.health === 'critical' ? '#dc3545' : 
                           project.health === 'warning' ? '#ffc107' : '#28a745'
                  }}>
                    {project.health}
                  </strong>
                </span>
                <span>
                  Progresso: <strong>{project.progress_percentage || 0}%</strong>
                </span>
              </div>

              <div style={{ 
                marginTop: '8px',
                height: '4px',
                backgroundColor: '#e9ecef',
                borderRadius: '2px',
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
      )}

      <div style={{ 
        marginTop: '40px', 
        padding: '16px', 
        backgroundColor: '#e3f2fd', 
        border: '1px solid #90caf9',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <strong>🐛 Debug Info:</strong>
        <br />
        - Projetos carregados: {projects.length}
        <br />
        - Última atualização: {new Date().toLocaleTimeString()}
        <br />
        - Status: {loading ? 'Carregando...' : 'OK'}
      </div>
    </div>
  )
}