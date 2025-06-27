// src/components/projects/ProjectListItem.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Eye, Calendar, MoreHorizontal, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

// Recriando a interface aqui para ser auto-contida
interface Project {
  id: string;
  name: string;
  status: string;
  project_type: string;
  risk_level: string;
  health: string;
  estimated_end_date?: string;
  start_date?: string;
  progress_percentage: number;
  total_budget: number;
  used_budget: number;
  client?: { company_name: string };
  manager?: { full_name: string };
  next_milestone?: string;
  // Este campo virá da nossa query com contagem
  project_team_members: { count: number }[];
}

interface ProjectListItemProps {
  project: Project;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/D';
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatCurrency = (value: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getStatusIcon = (status: string) => {
    switch(status) {
        case 'Executando': return <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white ring-2 ring-blue-500" title="Executando"></div>;
        case 'Concluído': return <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white ring-2 ring-green-500" title="Concluído"></div>;
        case 'Pausado': return <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white ring-2 ring-yellow-500" title="Pausado"></div>;
        case 'Cancelado': return <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-500" title="Cancelado"></div>;
        default: return <div className="w-3 h-3 bg-gray-400 rounded-full border-2 border-white ring-2 ring-gray-400" title="Indefinido"></div>;
    }
}

const Tag = ({ text, colorClass, isStrong = false }) => (
    <span className={`px-2 py-1 text-xs rounded-full ${colorClass} ${isStrong ? 'font-bold' : 'font-medium'}`}>
        {text}
    </span>
);

export default function ProjectListItem({ project }: ProjectListItemProps) {
    const router = useRouter();

    const daysRemaining = project.estimated_end_date
    ? Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

    const budgetUsedPercentage = project.total_budget > 0 ? (project.used_budget / project.total_budget) * 100 : 0;
    const remainingBudget = project.total_budget - project.used_budget;

    return (
        <div 
          className="bg-white rounded-lg border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg hover:border-blue-300"
          onClick={() => router.push(`/projetos/${project.id}`)}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    {getStatusIcon(project.status)}
                    <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
                    <Tag text={project.project_type} colorClass="bg-blue-100 text-blue-800" />
                    <Tag text={`Risco ${project.risk_level}`} colorClass="bg-yellow-100 text-yellow-800" />
                    {project.health === 'Crítico' && <Tag text="Crítico" colorClass="bg-red-100 text-red-800" isStrong />}
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Ver Detalhes
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"><Calendar className="w-4 h-4" /></button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-5 gap-6 text-sm mb-4">
                <div>
                    <div className="text-gray-500 mb-1">Cliente</div>
                    <div className="font-medium text-gray-800">{project.client?.company_name || 'N/A'}</div>
                </div>
                <div>
                    <div className="text-gray-500 mb-1">Gerente</div>
                    <div className="font-medium text-gray-800">{project.manager?.full_name || 'N/A'}</div>
                </div>
                <div>
                    <div className="text-gray-500 mb-1">Previsão Fim</div>
                    <div className="font-medium text-gray-800">{formatDate(project.estimated_end_date)}</div>
                    {daysRemaining !== null && (
                      <div className={`text-xs ${daysRemaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {daysRemaining < 0 ? `${Math.abs(daysRemaining)} dias atrasado` : `${daysRemaining} dias restantes`}
                      </div>
                    )}
                </div>
                <div>
                    <div className="text-gray-500 mb-1">Próximo Marco</div>
                    <div className="font-medium text-gray-800">{project.next_milestone || 'Não definido'}</div>
                </div>
                <div>
                    <div className="text-gray-500 mb-1">Equipe</div>
                    <div className="font-medium text-gray-800">{project.project_team_members?.[0]?.count || 0} pessoas</div>
                </div>
            </div>
            
            {/* Progress Bar & Financials */}
            <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Progresso: {project.progress_percentage}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-800">{formatCurrency(project.used_budget)}</span>
                    <span className="text-xs text-gray-500"> / {formatCurrency(project.total_budget)} ({budgetUsedPercentage.toFixed(1)}% usado)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 relative overflow-hidden">
                    <div 
                        className="bg-blue-600 h-full rounded-full" 
                        style={{ width: `${project.progress_percentage}%` }}
                    ></div>
                </div>
                 <div className="flex justify-between items-center mt-2 text-sm">
                  <div className="text-gray-500">Início: <span className="font-medium text-gray-700">{formatDate(project.start_date)}</span></div>
                  <div className="text-gray-500">Saldo: <span className="font-bold text-green-600">{formatCurrency(remainingBudget)}</span></div>
                </div>
            </div>
        </div>
    );
}