import { FinancialMetricsEntity, FinancialMetrics } from '../entities/FinancialMetrics'

export interface IMetricsRepository {
  getByPeriod(startDate: Date, endDate: Date): Promise<FinancialMetricsEntity>
  getByYear(year: number): Promise<FinancialMetricsEntity>
  getByMonth(year: number, month: number): Promise<FinancialMetricsEntity>
  calculateRealTime(): Promise<FinancialMetricsEntity>
}