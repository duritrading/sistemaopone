// src/app/projetos/[id]/components/shared/index.tsx
'use client'

import { ReactNode } from 'react'
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { MILESTONE_STATUSES, ACTIVITY_STATUSES } from '../../types/project.types'

// === KPI CARD ===
interface KPICardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  colorClass?: string
}

export const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  trend,
  colorClass = 'bg-gray-200' 
}: KPICardProps) => (
  <div className="bg-white p-6 rounded-lg border border-gray-300 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-6 h-6 text-gray-800" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      {trend && (
        <div className={`p-2 rounded-full ${
          trend === 'up' ? 'bg-green-100' : 
          trend === 'down' ? 'bg-red-100' : 'bg-gray-200'
        }`}>
          <TrendingUp className={`w-4 h-4 ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600 rotate-180' : 'text-gray-700'
          }`} />
        </div>
      )}
    </div>
  </div>
)

// === INFO CARD ===
interface InfoCardProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export const InfoCard = ({ 
  title, 
  icon: Icon, 
  children, 
  actions = null,
  className = '' 
}: InfoCardProps) => (
  <div className={`bg-white rounded-lg border border-gray-300 p-6 hover:shadow-sm transition-shadow ${className}`}>
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-800" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {actions}
    </div>
    <div>{children}</div>
  </div>
)

// === INFO PAIR ===
interface InfoPairProps {
  label: string
  value: string | null | undefined
  className?: string
}

export const InfoPair = ({ label, value, className = '' }: InfoPairProps) => (
  <div className={`py-2 ${className}`}>
    <span className="text-gray-700 font-medium">{label}:</span>
    <span className="ml-2 text-gray-900">{value || 'Não informado'}</span>
  </div>
)

// === STATUS BADGE ===
interface StatusBadgeProps {
  status: string
  type?: 'milestone' | 'activity' | 'health' | 'generic'
  className?: string
}

export const StatusBadge = ({ status, type = 'generic', className = '' }: StatusBadgeProps) => {
  const getStatusConfig = () => {
    if (type === 'health') {
      switch (status.toLowerCase()) {
        case 'verde': case 'healthy': return 'bg-green-100 text-green-800'
        case 'amarelo': case 'warning': return 'bg-yellow-100 text-yellow-800'
        case 'vermelho': case 'critical': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-200 text-gray-800'
      }
    }
    
    if (type === 'milestone') {
      const milestoneStatus = MILESTONE_STATUSES.find(s => s.value === status.toLowerCase())
      return milestoneStatus?.color || 'bg-gray-200 text-gray-800'
    }
    
    if (type === 'activity') {
      const activityStatus = ACTIVITY_STATUSES.find(s => s.value === status.toLowerCase())
      return activityStatus?.color || 'bg-gray-200 text-gray-800'
    }

    // Generic status mapping
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case 'completed': case 'approved': case 'delivered': case 'concluído': case 'aprovado':
        return 'bg-green-100 text-green-800'
      case 'in_progress': case 'review': case 'em andamento': case 'em revisão':
        return 'bg-blue-100 text-blue-800'
      case 'draft': case 'rascunho':
        return 'bg-gray-100 text-gray-800'
      case 'pending': case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'delayed': case 'cancelled': case 'atrasado': case 'cancelado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      // Milestones
      'pending': 'Pendente',
      'in_progress': 'Em Andamento', 
      'completed': 'Concluído',
      'delayed': 'Atrasado',
      'cancelled': 'Cancelado',
      // Activities
      'draft': 'Rascunho',
      'review': 'Em Revisão',
      'approved': 'Aprovado',
      'delivered': 'Entregue',
      // Health
      'healthy': 'Saudável',
      'warning': 'Atenção',
      'critical': 'Crítico'
    }
    return translations[status.toLowerCase()] || status
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusConfig()} ${className}`}>
      {translateStatus(status)}
    </span>
  )
}

// === LOADING SPINNER ===
interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingSpinner = ({ message = 'Carregando...', size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 mb-4`} />
      <p className="text-gray-700">{message}</p>
    </div>
  )
}

// === ERROR DISPLAY ===
interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  title?: string
}

export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = 'Erro ao carregar dados' 
}: ErrorDisplayProps) => (
  <div className="flex flex-col items-center justify-center py-12">
    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-700 mb-6 text-center max-w-md">{error}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Tentar Novamente
      </button>
    )}
  </div>
)

// === EMPTY STATE ===
interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState = ({ 
  title, 
  description, 
  icon: Icon,
  action 
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12">
    {Icon && (
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
    )}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-center max-w-md mb-6">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
)

// === SKELETON LOADER ===
interface SkeletonProps {
  className?: string
  count?: number
}

export const Skeleton = ({ className = 'h-4 bg-gray-200 rounded', count = 1 }: SkeletonProps) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={`animate-pulse ${className}`} />
    ))}
  </>
)

// === CARD SKELETON ===
export const CardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 bg-gray-200 rounded w-3/4" />
        <Skeleton className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
      <Skeleton className="h-6 bg-gray-200 rounded-full w-20" />
    </div>
    <div className="grid grid-cols-3 gap-4 mb-3">
      <Skeleton className="h-8 bg-gray-200 rounded" />
      <Skeleton className="h-8 bg-gray-200 rounded" />
      <Skeleton className="h-8 bg-gray-200 rounded" />
    </div>
    <div className="flex justify-between">
      <Skeleton className="h-4 bg-gray-200 rounded w-20" />
      <Skeleton className="h-4 bg-gray-200 rounded w-24" />
    </div>
  </div>
)

// === PROGRESS BAR ===
interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const ProgressBar = ({ 
  value, 
  max = 100, 
  color = 'bg-blue-600', 
  showLabel = true,
  size = 'md' 
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-700 mb-1">
          <span>Progresso</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div 
          className={`${color} ${sizeClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// === UTILITY FUNCTIONS ===
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Não definido'
  try {
    return new Date(dateString).toLocaleDateString('pt-BR')
  } catch {
    return 'Data inválida'
  }
}

export const formatCurrency = (value: number): string => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  } catch {
    return `R$ ${value.toFixed(2).replace('.', ',')}`
  }
}

export const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`
  }
  return formatCurrency(value)
}