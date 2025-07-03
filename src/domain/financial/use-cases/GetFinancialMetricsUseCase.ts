import { FinancialMetricsEntity } from '../entities/FinancialMetrics'
import { IMetricsRepository } from '../repositories/IMetricsRepository'
import { Logger } from '@/shared/utils/logger'

export interface GetFinancialMetricsRequest {
  year?: number
  month?: number
  startDate?: Date
  endDate?: Date
  realTime?: boolean
}

export interface GetFinancialMetricsResponse {
  metrics: FinancialMetricsEntity
  insights: {
    cashFlowHealth: 'healthy' | 'warning' | 'critical'
    growthTrend: 'up' | 'down' | 'stable'
    pendingReceitasPercentage: number
    pendingDespesasPercentage: number
    netProfit: number
    recommendations: string[]
  }
}

export class GetFinancialMetricsUseCase {
  constructor(
    private readonly metricsRepository: IMetricsRepository,
    private readonly logger: Logger
  ) {}

  async execute(request: GetFinancialMetricsRequest): Promise<GetFinancialMetricsResponse> {
    try {
      this.logger.info('Fetching financial metrics', { request })

      let metrics: FinancialMetricsEntity

      if (request.realTime) {
        metrics = await this.metricsRepository.calculateRealTime()
      } else if (request.startDate && request.endDate) {
        metrics = await this.metricsRepository.getByPeriod(request.startDate, request.endDate)
      } else if (request.year && request.month) {
        metrics = await this.metricsRepository.getByMonth(request.year, request.month)
      } else if (request.year) {
        metrics = await this.metricsRepository.getByYear(request.year)
      } else {
        metrics = await this.metricsRepository.getByYear(new Date().getFullYear())
      }

      // Generate insights
      const insights = this.generateInsights(metrics)

      return { metrics, insights }

    } catch (error) {
      this.logger.error('Error fetching financial metrics', { error, request })
      throw new Error('Erro ao buscar métricas financeiras')
    }
  }

  private generateInsights(metrics: FinancialMetricsEntity): GetFinancialMetricsResponse['insights'] {
    const cashFlowHealth = metrics.getCashFlowHealth()
    const growthTrend = metrics.getGrowthTrend()
    const pendingReceitasPercentage = metrics.getReceitasPendingPercentage()
    const pendingDespesasPercentage = metrics.getDespesasPendingPercentage()
    const netProfit = metrics.getNetProfit()

    const recommendations: string[] = []

    // Generate recommendations based on metrics
    if (cashFlowHealth === 'critical') {
      recommendations.push('Fluxo de caixa crítico. Revise despesas urgentemente.')
    }

    if (pendingReceitasPercentage > 50) {
      recommendations.push('Alto percentual de receitas pendentes. Intensifique cobrança.')
    }

    if (netProfit < 0) {
      recommendations.push('Lucro negativo. Analise categorias de maior despesa.')
    }

    if (growthTrend === 'down') {
      recommendations.push('Tendência de queda. Revise estratégia comercial.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Situação financeira estável. Continue monitorando.')
    }

    return {
      cashFlowHealth,
      growthTrend,
      pendingReceitasPercentage,
      pendingDespesasPercentage,
      netProfit,
      recommendations
    }
  }
}