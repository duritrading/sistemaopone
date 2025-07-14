'use client';

import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface ProjectionStats {
  netChange: number;
  lowestBalance: number;
  highestBalance: number;
  averageDaily: number;
  projectionDays: number;
  lastUpdate: string;
}

interface CashFlowProjectionProps {
  getProjectionStats?: ProjectionStats | null;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const CashFlowProjection: React.FC<CashFlowProjectionProps> = ({ 
  getProjectionStats 
}) => {
  // Early return se não há dados
  if (!getProjectionStats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Projeção de Fluxo de Caixa
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const stats = getProjectionStats;
  const netChange = stats.netChange ?? 0;
  const lowestBalance = stats.lowestBalance ?? 0;
  const highestBalance = stats.highestBalance ?? 0;
  const averageDaily = stats.averageDaily ?? 0;
  const projectionDays = stats.projectionDays ?? 30;

  const isPositiveTrend = netChange >= 0;
  const hasNegativeBalance = lowestBalance < 0;
  const isVolatile = Math.abs(highestBalance - lowestBalance) > Math.abs(averageDaily * 7);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Projeção de Fluxo de Caixa
        </h3>
        <div className="text-xs text-gray-500">
          {projectionDays} dias
        </div>
      </div>

      <div className="space-y-4">
        {/* Variação Líquida */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {isPositiveTrend ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Variação Líquida
            </span>
          </div>
          <span className={`text-lg font-bold ${
            isPositiveTrend ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(netChange)}
          </span>
        </div>

        {/* Média Diária */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Média Diária
            </span>
          </div>
          <span className="text-lg font-bold text-gray-800">
            {formatCurrency(averageDaily)}
          </span>
        </div>

        {/* Faixa de Saldo */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Faixa de Saldo Projetada
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-red-600">
              Mínimo: {formatCurrency(lowestBalance)}
            </span>
            <span className="text-green-600">
              Máximo: {formatCurrency(highestBalance)}
            </span>
          </div>
          {isVolatile && (
            <div className="mt-2 text-xs text-yellow-600">
              ⚠️ Alta volatilidade detectada
            </div>
          )}
        </div>

        {/* Alertas */}
        {hasNegativeBalance && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Saldo Negativo Previsto
              </p>
              <p className="text-xs text-red-600 mt-1">
                Menor saldo: {formatCurrency(lowestBalance)}
              </p>
            </div>
          </div>
        )}

        {netChange < 0 && Math.abs(netChange) > Math.abs(averageDaily * 7) && (
          <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Tendência de Queda
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Perda semanal projetada superior à média
              </p>
            </div>
          </div>
        )}

        {/* Última Atualização */}
        {stats.lastUpdate && (
          <div className="text-xs text-gray-400 text-center mt-4">
            Última atualização: {new Date(stats.lastUpdate).toLocaleString('pt-BR')}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowProjection;