// src/app/login/page.tsx - CORRIGIDO PARA ATUALIZAR ESTADO IMEDIATAMENTE
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

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
  const { setUser, refreshUser } = useAuth() // USAR CONTEXTO DE AUTH

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
      console.log('🔐 Tentando login...', { email: data.email })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Login bem-sucedido!')
        
        // ATUALIZAR CONTEXTO IMEDIATAMENTE
        if (result.user) {
          setUser(result.user)
          console.log('✅ Usuário definido no contexto:', result.user)
        }
        
        // FORÇAR ATUALIZAÇÃO DOS DADOS
        await refreshUser()
        
        // NOTIFICAR OUTRAS ABAS
        localStorage.setItem('auth_user_updated', Date.now().toString())
        
        console.log('🔄 Redirecionando para dashboard...')
        router.push('/dashboard')
        router.refresh()
      } else {
        console.log('❌ Login falhou:', result.message)
        setError(result.message || 'Erro ao fazer login')
      }
    } catch (error) {
      console.error('❌ Erro de conexão:', error)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#060E16' }}>
      {/* Enhanced Technology Background */}
      <div className="absolute inset-0">
        {/* Floating circles */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-2xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-xl animate-float-slow"></div>
        
        {/* Grid Pattern */}
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
        
        {/* Animated dots */}
        <div className="absolute top-32 right-32 w-3 h-3 bg-blue-400/30 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 left-32 w-2 h-2 bg-indigo-400/40 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-cyan-400/50 rounded-full animate-ping delay-700"></div>
      </div>

      {/* Login Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-md">
          {/* Logo com animação fadeInDown */}
          <div className="text-center mb-12 animate-fadeInDown">
            <div className="w-28 h-28 mx-auto mb-6 relative flex items-center justify-center">
              <img
                src="/Logo%20OpOne%20Fundo%20Preto.png"
                alt="OpOne Logo"
                className="w-24 h-24 object-contain filter drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
                }}
                onLoad={() => console.log('✅ Logo carregada de /Logo%20OpOne%20Fundo%20Preto.png')}
                onError={(e) => {
                  console.log('❌ Tentando /images/Logo%20OpOne%20Fundo%20Preto.png...')
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/Logo%20OpOne%20Fundo%20Preto.png';
                  target.onerror = () => {
                    console.log('❌ Tentando JPG...')
                    target.src = '/opone-logo.jpg';
                    target.onerror = () => {
                      console.log('❌ Usando SVG fallback')
                      target.style.display = 'none';
                      const svg = target.nextElementSibling as HTMLElement;
                      if (svg) svg.style.display = 'block';
                    }
                  }
                }}
              />
              
              {/* SVG Fallback */}
              <svg 
                width="96" 
                height="96" 
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
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-white mb-3 tracking-wide">OpOne</h1>
            <p className="text-slate-300 text-lg">Sistema de Gestão</p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mt-4"></div>
          </div>

          {/* Login Card com animação fadeInUp */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden animate-fadeInUp">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10 rounded-3xl"></div>
            
            <div className="relative z-10">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Acesso ao Sistema</h2>
                <p className="text-gray-300">Entre com suas credenciais</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field com animação */}
                <div className="animate-slideInLeft">
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
                      className="block w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-white placeholder-gray-300 hover:bg-white/25 focus:scale-[1.02]"
                      placeholder="seu.email@opone.com"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400 flex items-center animate-shake">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field com animação */}
                <div className="animate-slideInRight">
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
                      className="block w-full pl-12 pr-12 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-white placeholder-gray-300 hover:bg-white/25 focus:scale-[1.02]"
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
                    <p className="mt-2 text-sm text-red-400 flex items-center animate-shake">
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Error Message com animação shake */}
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-4 animate-shake">
                    <p className="text-sm text-red-300 text-center flex items-center justify-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Button com animação bounce */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-400/50 disabled:to-indigo-500/50 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 active:translate-y-0 disabled:transform-none backdrop-blur-sm animate-bounceIn"
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

          {/* Footer com animação fadeIn */}
          <div className="text-center mt-8 animate-fadeIn">
            <p className="text-xs text-gray-400">
              © 2025 OpOne. Sistema de Gestão Empresarial.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-20px, -20px) rotate(1deg); }
          66% { transform: translate(20px, -10px) rotate(-1deg); }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 20s ease-in-out infinite;
          animation-delay: 7s;
        }
        
        .animate-float-slow {
          animation: float 25s ease-in-out infinite;
          animation-delay: 3s;
        }
        
        .animate-fadeInDown {
          animation: fadeInDown 0.8s ease-out;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out 0.2s;
          animation-fill-mode: both;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out 0.4s;
          animation-fill-mode: both;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out 0.6s;
          animation-fill-mode: both;
        }
        
        .animate-bounceIn {
          animation: bounceIn 0.8s ease-out 0.8s;
          animation-fill-mode: both;
        }
        
        .animate-shake {
          animation: shake 0.6s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out 1s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  )
}