// src/app/financeiro/components/LoadingSpinner.tsx
'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars'
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  message?: string
  progress?: number
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'spinner',
  color = 'blue',
  message,
  progress,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    yellow: 'border-yellow-600',
    red: 'border-red-600',
    gray: 'border-gray-600'
  }

  const textColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div 
            className={`
              animate-spin rounded-full border-2 border-gray-200 
              ${sizeClasses[size]} ${colorClasses[color]} 
              border-t-transparent
            `}
          />
        )

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`
                  ${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'}
                  bg-current rounded-full animate-pulse
                  ${textColorClasses[color]}
                `}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )

      case 'pulse':
        return (
          <div 
            className={`
              animate-pulse rounded-full
              ${sizeClasses[size]} 
              bg-current opacity-60
              ${textColorClasses[color]}
            `}
          />
        )

      case 'bars':
        return (
          <div className="flex items-end space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`
                  ${size === 'sm' ? 'w-1 h-3' : size === 'md' ? 'w-1 h-4' : size === 'lg' ? 'w-1.5 h-6' : 'w-2 h-8'}
                  bg-current rounded-sm animate-pulse
                  ${textColorClasses[color]}
                `}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.2s'
                }}
              />
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {renderSpinner()}
      
      {message && (
        <p className={`text-sm font-medium ${textColorClasses[color]}`}>
          {message}
        </p>
      )}

      {progress !== undefined && (
        <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full bg-current transition-all duration-300 ease-out ${textColorClasses[color]}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Specialized loading states
export function TableLoadingState({ message = "Carregando transações..." }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <LoadingSpinner size="lg" variant="spinner" color="blue" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  )
}

export function ButtonLoadingState({ 
  size = 'sm', 
  color = 'blue' 
}: { 
  size?: 'sm' | 'md'
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
}) {
  return (
    <LoadingSpinner 
      size={size} 
      variant="spinner" 
      color={color}
      className="mr-2" 
    />
  )
}

export function FullScreenLoading({ 
  message = "Carregando...",
  progress 
}: { 
  message?: string
  progress?: number 
}) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner 
          size="xl" 
          variant="spinner" 
          color="blue" 
          message={message}
          progress={progress}
        />
      </div>
    </div>
  )
}