// src/presentation/financial/components/MetricCard.tsx
import React, { memo } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  formattedValue?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  status?: 'healthy' | 'warning' | 'critical'
  icon?: React.ReactNode
  description?: string
  onClick?: () => void
  className?: string
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  formattedValue,
  trend,
  trendValue,
  status,
  icon,
  description,
  onClick,
  className = ''
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'critical':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  return (
    <div
      className={`
        rounded-lg border p-6 transition-all duration-200
        ${getStatusColor()}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-2xl font-bold text-gray-900">
                {formattedValue || value}
              </p>
              {trend && (
                <div className="flex items-center space-x-1">
                  {getTrendIcon()}
                  {trendValue && (
                    <span className={`text-sm font-medium ${
                      trend === 'up' ? 'text-green-600' : 
                      trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trendValue}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {status && (
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
        )}
      </div>
      
      {description && (
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      )}
    </div>
  )
})