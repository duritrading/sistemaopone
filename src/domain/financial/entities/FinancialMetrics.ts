// src/domain/financial/entities/FinancialMetrics.ts
import { z } from 'zod'

export const FinancialMetricsSchema = z.object({
  receitas_em_aberto: z.number().default(0),
  receitas_realizadas: z.number().default(0),
  despesas_em_aberto: z.number().default(0),
  despesas_realizadas: z.number().default(0),
  total_periodo: z.number().default(0),
  accounts_balance: z.number().default(0),
  monthly_cash_flow: z.number().default(0),
  quarterly_growth: z.number().default(0),
  period_start: z.date(),
  period_end: z.date(),
  calculated_at: z.date()
})

export type FinancialMetrics = z.infer<typeof FinancialMetricsSchema>

export class FinancialMetricsEntity {
  private constructor(private readonly props: FinancialMetrics) {}

  static create(data: Omit<FinancialMetrics, 'calculated_at'>): FinancialMetricsEntity {
    const metrics = FinancialMetricsSchema.parse({
      ...data,
      calculated_at: new Date()
    })
    
    return new FinancialMetricsEntity(metrics)
  }

  static fromData(data: FinancialMetrics): FinancialMetricsEntity {
    return new FinancialMetricsEntity(FinancialMetricsSchema.parse(data))
  }

  // Getters
  get receitasEmAberto(): number { return this.props.receitas_em_aberto }
  get receitasRealizadas(): number { return this.props.receitas_realizadas }
  get despesasEmAberto(): number { return this.props.despesas_em_aberto }
  get despesasRealizadas(): number { return this.props.despesas_realizadas }
  get totalPeriodo(): number { return this.props.total_periodo }
  get accountsBalance(): number { return this.props.accounts_balance }
  get monthlyCashFlow(): number { return this.props.monthly_cash_flow }
  get quarterlyGrowth(): number { return this.props.quarterly_growth }
  get periodStart(): Date { return this.props.period_start }
  get periodEnd(): Date { return this.props.period_end }
  get calculatedAt(): Date { return this.props.calculated_at }

  // Business Logic
  getTotalReceitas(): number {
    return this.receitasEmAberto + this.receitasRealizadas
  }

  getTotalDespesas(): number {
    return this.despesasEmAberto + this.despesasRealizadas
  }

  getNetProfit(): number {
    return this.receitasRealizadas - this.despesasRealizadas
  }

  getReceitasPendingPercentage(): number {
    const total = this.getTotalReceitas()
    return total > 0 ? (this.receitasEmAberto / total) * 100 : 0
  }

  getDespesasPendingPercentage(): number {
    const total = this.getTotalDespesas()
    return total > 0 ? (this.despesasEmAberto / total) * 100 : 0
  }

  getCashFlowHealth(): 'healthy' | 'warning' | 'critical' {
    const ratio = this.monthlyCashFlow / Math.max(this.despesasRealizadas, 1)
    
    if (ratio > 0.5) return 'healthy'
    if (ratio > 0.2) return 'warning'
    return 'critical'
  }

  getGrowthTrend(): 'up' | 'down' | 'stable' {
    if (this.quarterlyGrowth > 5) return 'up'
    if (this.quarterlyGrowth < -5) return 'down'
    return 'stable'
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  toJSON(): FinancialMetrics {
    return { ...this.props }
  }
}