// src/shared/di/ServiceTokens.ts
/**
 * Tokens para identificar serviços no container
 */

export const ServiceTokens = {
  // Repositories
  TRANSACTION_REPOSITORY: 'TransactionRepository' as const,
  ACCOUNT_REPOSITORY: 'AccountRepository' as const,
  METRICS_REPOSITORY: 'MetricsRepository' as const,
  
  // Use Cases
  CREATE_TRANSACTION_USE_CASE: 'CreateTransactionUseCase' as const,
  GET_TRANSACTIONS_USE_CASE: 'GetTransactionsUseCase' as const,
  UPDATE_TRANSACTION_USE_CASE: 'UpdateTransactionUseCase' as const,
  DELETE_TRANSACTION_USE_CASE: 'DeleteTransactionUseCase' as const,
  BULK_UPDATE_TRANSACTIONS_USE_CASE: 'BulkUpdateTransactionsUseCase' as const,
  GET_FINANCIAL_METRICS_USE_CASE: 'GetFinancialMetricsUseCase' as const,
  
  // Services
  FINANCIAL_CALCULATOR: 'FinancialCalculator' as const,
  CACHE_SERVICE: 'CacheService' as const,
  
  // Infrastructure
  LOGGER: 'Logger' as const,
  PERFORMANCE_MONITOR: 'PerformanceMonitor' as const,
  
  // External Services
  SUPABASE_CLIENT: 'SupabaseClient' as const,
  EMAIL_SERVICE: 'EmailService' as const,
  NOTIFICATION_SERVICE: 'NotificationService' as const
} as const

export type ServiceToken = typeof ServiceTokens[keyof typeof ServiceTokens]