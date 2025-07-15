// src/app/login/page.tsx - BACKGROUND ONDAS SUTIS + CARD AJUSTADO
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
  const { setUser, refreshUser } = useAuth()

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
        
        if (result.user) {
          setUser(result.user)
          console.log('✅ Usuário definido no contexto:', result.user)
        }
        
        await refreshUser()
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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#040E15' }}>
      
      {/* BACKGROUND ONDAS SUTIS */}
      <div className="absolute inset-0">
        
        {/* Wave Background */}
        <div className="absolute inset-0 opacity-8">
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
            <defs>
              <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
                <stop offset="50%" stopColor="rgba(34, 211, 238, 0.4)" />
                <stop offset="100%" stopColor="rgba(99, 102, 241, 0.3)" />
              </linearGradient>
              <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(34, 211, 238, 0.25)" />
                <stop offset="50%" stopColor="rgba(139, 92, 246, 0.35)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.25)" />
              </linearGradient>
            </defs>
            <path d="M 0 400 Q 400 300 800 400 T 1600 400 L 1600 500 L 0 500 Z" fill="url(#wave1)" className="animate-wave-1"/>
            <path d="M 0 450 Q 300 350 600 450 T 1200 450 L 1200 550 L 0 550 Z" fill="url(#wave2)" className="animate-wave-2"/>
            <path d="M 0 500 Q 500 400 1000 500 T 2000 500 L 2000 600 L 0 600 Z" fill="url(#wave1)" className="animate-wave-3"/>
          </svg>
        </div>
        
        {/* Flowing Data Streams - Vertical */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/6 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400/30 to-transparent animate-data-stream"></div>
          <div className="absolute top-0 left-1/4 w-0.5 h-full bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent animate-data-stream delay-700"></div>
          <div className="absolute top-0 left-1/3 w-0.5 h-full bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent animate-data-stream delay-1400"></div>
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400/25 to-transparent animate-data-stream delay-2100"></div>
          <div className="absolute top-0 left-2/3 w-0.5 h-full bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-data-stream delay-2800"></div>
          <div className="absolute top-0 left-3/4 w-0.5 h-full bg-gradient-to-b from-transparent via-violet-400/25 to-transparent animate-data-stream delay-3500"></div>
          <div className="absolute top-0 left-5/6 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400/30 to-transparent animate-data-stream delay-4200"></div>
        </div>
        
        {/* Scanning Waves - Horizontal */}
        <div className="absolute inset-0 opacity-6">
          <div className="absolute top-1/6 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-scan-horizontal"></div>
          <div className="absolute top-1/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent animate-scan-horizontal delay-2000"></div>
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent animate-scan-horizontal delay-4000"></div>
          <div className="absolute top-2/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-violet-400/35 to-transparent animate-scan-horizontal delay-6000"></div>
          <div className="absolute top-5/6 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-scan-horizontal delay-8000"></div>
        </div>
        
        {/* Organic Connections */}
        <div className="absolute inset-0 opacity-12">
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
            <path d="M 100 200 Q 300 100 500 300 T 900 400" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="1" fill="none" className="animate-path-draw"/>
            <path d="M 200 500 Q 400 300 600 600 T 1000 500" stroke="rgba(34, 211, 238, 0.25)" strokeWidth="1" fill="none" className="animate-path-draw delay-700"/>
            <path d="M 50 600 Q 250 400 450 700 T 800 600" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1" fill="none" className="animate-path-draw delay-1400"/>
            <path d="M 150 100 Q 350 250 550 150 T 850 300" stroke="rgba(139, 92, 246, 0.25)" strokeWidth="1" fill="none" className="animate-path-draw delay-2100"/>
          </svg>
        </div>
        
        {/* AI Processing Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-radial from-blue-500/4 via-blue-500/1 to-transparent rounded-full blur-3xl animate-orb-breathe"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-radial from-indigo-500/4 via-indigo-500/1 to-transparent rounded-full blur-2xl animate-orb-breathe-delayed"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-radial from-cyan-500/4 via-cyan-500/1 to-transparent rounded-full blur-xl animate-orb-breathe-slow"></div>
        
        {/* Floating Data Particles */}
        <div className="absolute top-1/6 right-1/4 w-1 h-1 bg-blue-400/40 rounded-full animate-particle-drift"></div>
        <div className="absolute top-1/3 left-1/5 w-1 h-1 bg-cyan-400/40 rounded-full animate-particle-drift delay-800"></div>
        <div className="absolute top-2/3 right-1/5 w-1 h-1 bg-indigo-400/40 rounded-full animate-particle-drift delay-1600"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-violet-400/40 rounded-full animate-particle-drift delay-2400"></div>
        
      </div>

      {/* Login Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-md">
          
          {/* Login Card - Gradiente Ajustado */}
          <div className="relative overflow-hidden animate-fadeInUp" style={{ 
            background: 'linear-gradient(135deg, rgba(20, 35, 55, 0.95) 0%, rgba(12, 22, 35, 0.95) 50%, rgba(8, 15, 26, 0.95) 100%)', 
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(30, 58, 138, 0.25)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(20, 35, 55, 0.3)',
            paddingTop: '0px', 
            paddingLeft: '32px', 
            paddingRight: '32px', 
            paddingBottom: '32px', 
            marginTop: '-26px' 
          }}>
            
            {/* Card Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700/8 via-transparent to-blue-900/8 rounded-3xl"></div>
            
            <div className="relative z-10">
              
              {/* Logo + Sistema de Gestão */}
              <div className="text-center" style={{ marginBottom: '24px', marginTop: '-12px' }}>
                <div className="flex justify-center" style={{ marginBottom: '-60px' }}>
                  <img
                    src="/logo-vazia.png"
                    alt="OpOne Logo"
                    className="object-contain"
                    style={{ 
                      width: '280px',     
                      height: '280px',    
                      display: 'block',
                      marginTop: '-20px'
                    }}
                    onLoad={() => console.log('✅ Logo carregada: logo-vazia.png')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/opone-logo.png';
                    }}
                  />
                </div>
                
                <p className="text-slate-300 text-base" style={{ marginBottom: '50px', transform: 'translateY(-24px)' }}>Consultoria em Inteligência Artificial</p>
                
                <h2 className="text-2xl font-bold text-white mb-2">Acesso ao Sistema</h2>
                <p className="text-slate-300">Entre com suas credenciais</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-3">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 backdrop-blur-sm border border-slate-700/60 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-white placeholder-slate-400 hover:bg-slate-900/70"
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
                  <label className="block text-sm font-semibold text-slate-200 mb-3">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="block w-full pl-12 pr-12 py-4 bg-slate-900/50 backdrop-blur-sm border border-slate-700/60 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-white placeholder-slate-400 hover:bg-slate-900/70"
                      placeholder="Digite sua senha"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
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
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-400/50 disabled:to-indigo-500/50 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-2xl"
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
          <div className="text-center mt-6">
            <p className="text-xs text-white">
              © 2025 OpOne. Consultoria em Inteligência Artificial.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes wave-1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-50px); }
        }
        
        @keyframes wave-2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(50px); }
        }
        
        @keyframes wave-3 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-30px); }
        }
        
        @keyframes data-stream {
          0% { transform: translateY(-100vh) scaleY(0); opacity: 0; }
          10% { opacity: 1; transform: scaleY(1); }
          90% { opacity: 1; }
          100% { transform: translateY(100vh) scaleY(0); opacity: 0; }
        }
        
        @keyframes scan-horizontal {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes path-draw {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 1000 0; }
        }
        
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.2; }
        }
        
        @keyframes particle-drift {
          0% { transform: translate(0, 0); opacity: 0.4; }
          25% { transform: translate(30px, -15px); opacity: 0.8; }
          50% { transform: translate(-15px, -40px); opacity: 0.6; }
          75% { transform: translate(-30px, -25px); opacity: 0.8; }
          100% { transform: translate(0, -60px); opacity: 0; }
        }
        
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        .animate-wave-1 { animation: wave-1 20s ease-in-out infinite; }
        .animate-wave-2 { animation: wave-2 25s ease-in-out infinite; }
        .animate-wave-3 { animation: wave-3 30s ease-in-out infinite; }
        .animate-data-stream { animation: data-stream 8s linear infinite; }
        .animate-scan-horizontal { animation: scan-horizontal 10s linear infinite; }
        .animate-path-draw { animation: path-draw 8s ease-in-out infinite; }
        .animate-orb-breathe { animation: orb-breathe 12s ease-in-out infinite; }
        .animate-orb-breathe-delayed { animation: orb-breathe 12s ease-in-out infinite; animation-delay: 4s; }
        .animate-orb-breathe-slow { animation: orb-breathe 16s ease-in-out infinite; animation-delay: 2s; }
        .animate-particle-drift { animation: particle-drift 12s ease-out infinite; }
      `}</style>
    </div>
  )
}