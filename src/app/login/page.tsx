// src/app/login/page.tsx - VERSÃO FINAL SEM ERROS
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(result.message || 'Erro ao fazer login')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#060E16' }}>
      {/* Enhanced Technology Background */}
      <div className="absolute inset-0">
        {/* Advanced Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
          }}></div>
        </div>
        
        {/* Tech Circuit Lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent"></div>
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
        
        {/* Floating Tech Elements */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-lg animate-pulse delay-700"></div>
        
        {/* Matrix-style dots */}
        <div className="absolute top-32 right-32 w-3 h-3 bg-blue-400/30 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 left-32 w-2 h-2 bg-indigo-400/40 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-cyan-400/50 rounded-full animate-ping delay-700"></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400/30 rounded-full animate-ping delay-1000"></div>
        
        {/* Tech nodes */}
        <div className="absolute top-40 left-1/2 w-4 h-4 border border-blue-400/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-40 left-1/3 w-3 h-3 border border-indigo-400/40 rounded-sm rotate-45 animate-pulse delay-500"></div>
        <div className="absolute top-1/2 right-20 w-2 h-2 border border-cyan-400/50 rounded-full animate-pulse delay-300"></div>
        
        {/* Hexagonal patterns */}
        <div className="absolute top-20 right-20 w-8 h-8 border border-blue-400/20 transform rotate-12 animate-spin-slow"></div>
        <div className="absolute bottom-20 left-20 w-6 h-6 border border-indigo-400/25 transform -rotate-12 animate-spin-slow delay-1000"></div>
      </div>

      {/* Login Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-md">
          {/* Logo com Novo Arquivo */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto mb-6 relative flex items-center justify-center">
              <img
                src="/images/Logo OpOne sem fundo 500x500.png"
                alt="OpOne Logo"
                className="w-20 h-20 object-contain filter drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
                }}
                onLoad={() => console.log('✅ Logo carregada: Logo OpOne sem fundo 500x500.png')}
                onError={(e) => {
                  console.log('❌ Erro com PNG, tentando JPG...')
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/Logo OpOne sem fundo 500x500.jpg';
                  target.onerror = () => {
                    console.log('❌ Erro com JPG também, usando SVG fallback')
                    target.style.display = 'none';
                    const svg = target.nextElementSibling as HTMLElement;
                    if (svg) svg.style.display = 'block';
                  }
                }}
              />
              
              {/* SVG Fallback melhorado */}
              <svg 
                width="80" 
                height="80" 
                viewBox="0 0 120 120" 
                className="hidden filter drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
                }}
              >
                <circle cx="60" cy="60" r="56" fill="white" stroke="none"/>
                <circle cx="60" cy="60" r="42" fill="#1a1a2e"/>
                <path
                  d="M 35 45 Q 35 30 50 30 Q 65 30 65 45 Q 65 60 50 75 Q 45 70 42 65 Q 35 55 35 45 Z"
                  fill="white"
                  transform="translate(8, 8)"
                />
                <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2"/>
                <circle cx="50" cy="45" r="3" fill="rgba(255, 255, 255, 0.3)"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">OpOne</h1>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto"></div>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10 rounded-3xl"></div>
            
            <div className="relative z-10">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Acesso ao Sistema</h2>
                <p className="text-gray-300">Entre com suas credenciais</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      className="block w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-white placeholder-gray-300"
                      placeholder="seu.email@opone.com"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="block w-full pl-12 pr-12 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-white placeholder-gray-300"
                      placeholder="Digite sua senha"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-4">
                    <p className="text-sm text-red-300 text-center flex items-center justify-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-400/50 disabled:to-indigo-500/50 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none backdrop-blur-sm"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      <span>Entrar</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-400">
              © 2025 OpOne. Sistema de Gestão Empresarial.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  )
}