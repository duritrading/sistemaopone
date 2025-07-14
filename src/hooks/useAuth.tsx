// src/hooks/useAuth.tsx - CORRIGIDO
'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// Definir AuthUser localmente para evitar problemas de importação
interface AuthUser {
  id: string
  email: string
  full_name: string
  profile_photo_url: string | null
  seniority_level: string
  primary_specialization: string
  first_login: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: AuthUser | null) => void // ADICIONADO para atualização manual
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()

  const fetchUser = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store' // FORÇA BUSCAR DADOS FRESCOS
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Usuário carregado:', data.user)
        setUser(data.user)
      } else {
        console.log('❌ Sem usuário logado')
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
      console.log('✅ Logout realizado')
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('❌ Erro no logout:', error)
    }
  }

  const refreshUser = async (): Promise<void> => {
    console.log('🔄 Atualizando dados do usuário...')
    await fetchUser()
  }

  // CARREGAR USUÁRIO NA INICIALIZAÇÃO
  useEffect(() => {
    console.log('🚀 AuthProvider: Inicializando...')
    fetchUser()
  }, [])

  // ESCUTAR MUDANÇAS DE STORAGE PARA SINCRONIZAR ABAS
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user_updated') {
        console.log('🔄 Detectada mudança de auth, atualizando...')
        fetchUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const contextValue: AuthContextType = {
    user,
    loading,
    logout,
    refreshUser,
    setUser // PERMITIR ATUALIZAÇÃO MANUAL DO USUÁRIO
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}