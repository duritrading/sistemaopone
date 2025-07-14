// src/app/financeiro/types/index.ts
// Central export for all financial types

export type {
  Transaction,
  Account,
  FinancialMetrics,
  ProjectionStats,
  DateFilter,
  TransactionFilters,
  BulkAction,
  TransactionAction,
  ToastMessage,
  LoadingState,
  PaginationState,
  SortState,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionResponse,
  MetricsResponse,
  TransactionComponentProps,
  TransactionListProps,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  AccountType
} from './financial'

export {
  isTransaction,
  isAccount
} from './financial'

// Re-export for backward compatibility
export type { Transaction as FinancialTransaction } from './financial'