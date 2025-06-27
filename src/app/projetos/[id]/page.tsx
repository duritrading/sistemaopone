// src/app/projetos/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Edit, AlertTriangle, Calendar, Users, DollarSign, 
  Target, BarChart3, CheckCircle, FileText, Code, Clock,
  CheckSquare, Loader, XSquare 
} from 'lucide-react'
import { Gantt, Task, ViewMode } from 'gantt-task-react'
import "gantt-task-react/dist/index.css"

// --- Interfaces ---
interface ProjectDetails {
  id: string;
  name: string;
  description?: string;
  status: string;
  health: string;
  progress_percentage: number;
  total_budget: number;
  used_budget: number;
  start_date?: string;
  estimated_end_date?: string;
  risk_level: string;
  project_type: string;
  next_milestone?: string;
  client?: { company_name: string };
  manager?: { full_name: string };
  technologies: { id: string, name: string }[]; // Adicionado 'id' para a chave
  team_members: {
    role_in_project: string;
    team_member: {
        full_name: string;
        primary_specialization: string;
    }
  }[];
  scope_items: { id: string, title: string, status: string }[];
}

interface ProjectMilestone {
  id: string;
  title: string;
  due_date?: string;
  start_date?: string;
  status: string;
  progress_percentage: number;
  team_member?: { full_name: string };
}

// --- Componentes de UI ---
const KPI_Card = ({ title, value, icon: Icon, colorClass, subtitle }) => (
    <div className={`p-4 rounded-lg flex items-center gap-4 bg-white border border-gray-200 ${colorClass}`}>
        {Icon && <Icon className="w-6 h-6 text-gray-700" />}
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
    </div>
);

const InfoCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                {Icon && <Icon className="w-5 h-5 text-gray-600" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InfoPair = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value || 'N/D'}</p>
    </div>
);

// --- Página Principal ---
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false); // Estado para resolver erro de Hydration

  useEffect(() => {
    setIsClient(true); // Garante que o código do lado do cliente seja executado após a montagem
    if (projectId) {
      loadProjectDetails();
    }
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      const projectPromise = supabase
        .from('projects')
        .select(`
          *, 
          client:clients(company_name), 
          manager:team_members(full_name),
          technologies:project_technologies(id, name), 
          scope_items:project_scope(id, title, status),
          team_members:project_team_members(
            role_in_project,
            team_member:team_members(full_name, primary_specialization)
          )
        `)
        .eq('id', projectId)
        .single();
      
      const milestonesPromise = supabase
        .from('project_milestones')
        .select(`*, team_member:team_members(full_name), start_date`)
        .eq('project_id', projectId)
        .order('due_date');

      const [
          { data: projectData, error: projectError }, 
          { data: milestonesData, error: milestonesError }
      ] = await Promise.all([projectPromise, milestonesPromise]);

      if (projectError) throw projectError;
      if (milestonesError) throw milestonesError;
      
      setProject(projectData);
      setMilestones(milestonesData || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/D';
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  
  const getHealthConfig = (health: string) => {
      switch (health) {
          case 'Crítico': return { text: 'Crítico', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
          case 'Bom': return { text: 'Bom', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
          default: return { text: 'Excelente', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      }
  };
  
  const healthConfig = project ? getHealthConfig(project.health) : null;
  const daysRemaining = project?.estimated_end_date ? Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  const ganttTasks: Task[] = milestones.map(m => ({
    start: m.start_date ? new Date(m.start_date) : (m.due_date ? new Date(new Date(m.due_date).setDate(new Date(m.due_date).getDate() - 7)) : new Date()),
    end: m.due_date ? new Date(m.due_date) : new Date(),
    name: m.title, 
    id: m.id, 
    type: 'task', 
    progress: m.progress_percentage, 
    isDisabled: m.status === 'Concluído',
  }));

  const timelineMetrics = {
      concluidos: milestones.filter(m => m.status === 'Concluído').length,
      emAndamento: milestones.filter(m => m.status === 'Em Andamento').length,
      atrasados: milestones.filter(m => m.status === 'Atrasado').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
       <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Erro ao Carregar Projeto</h2>
          <pre className="bg-red-100 text-red-700 p-4 rounded-md text-sm">{error || "Projeto não encontrado."}</pre>
          <button 
            onClick={() => router.push('/projetos')}
            className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Voltar para a Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => router.push('/projetos')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar</span>
            </button>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${healthConfig?.color}`}>
                {project.status}
              </span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700">
                <Edit className="w-4 h-4" />
                Editar Projeto
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <KPI_Card title="Saúde" value={healthConfig?.text} icon={healthConfig?.icon} />
            <KPI_Card title="Progresso" value={`${project.progress_percentage}%`} icon={BarChart3} />
            {isClient && <KPI_Card title="Dias Restantes" value={daysRemaining ?? '--'} icon={Clock} />}
            <KPI_Card title="Orçamento Usado" value={formatCurrency(project.used_budget)} icon={DollarSign} subtitle={`de ${formatCurrency(project.total_budget)}`} />
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button onClick={() => setActiveTab('overview')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Visão Geral</button>
            <button onClick={() => setActiveTab('timeline')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cronograma</button>
            <button onClick={() => setActiveTab('risks')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'risks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Riscos</button>
            <button onClick={() => setActiveTab('deliverables')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'deliverables' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Entregáveis</button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InfoCard title="Informações do Projeto" icon={Target}>
                  <p className="text-gray-700">{project.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <InfoPair label="Tipo" value={project.project_type} />
                      <InfoPair label="Nível de Risco" value={project.risk_level} />
                      <InfoPair label="Gerente" value={project.manager?.full_name} />
                      <InfoPair label="Próximo Marco" value={project.next_milestone} />
                  </div>
              </InfoCard>
              <InfoCard title="Cronograma" icon={Calendar}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoPair label="Data de Início" value={formatDate(project.start_date)} />
                      <InfoPair label="Previsão de Fim" value={formatDate(project.estimated_end_date)} />
                  </div>
                  <div>
                      <p className="text-sm text-gray-500 mb-1">Progresso Geral</p>
                       <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${project.progress_percentage}%`}}></div>
                        </div>
                  </div>
              </InfoCard>
              <InfoCard title="Tecnologias" icon={Code}>
                  <div className="flex flex-wrap gap-2">
                      {project.technologies.filter(tech => tech.name).map(tech => (
                          <span key={tech.id} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-full">{tech.name}</span>
                      ))}
                  </div>
              </InfoCard>
            </div>
            <div className="space-y-6">
                <InfoCard title="Informações Financeiras" icon={DollarSign}>
                    <InfoPair label="Orçamento Total" value={formatCurrency(project.total_budget)} />
                    <InfoPair label="Valor Utilizado" value={formatCurrency(project.used_budget)} />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Progresso Financeiro</p>
                       <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-green-600 h-2.5 rounded-full" style={{width: `${(project.used_budget / project.total_budget) * 100}%`}}></div>
                        </div>
                  </div>
                </InfoCard>
                <InfoCard title="Equipe Alocada" icon={Users}>
                    <div className="space-y-3">
                        {project.team_members.map(member => (
                            <div key={member.team_member.full_name} className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-800">{member.team_member.full_name}</p>
                                    <p className="text-xs text-gray-500">{member.role_in_project || member.team_member.primary_specialization}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </InfoCard>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <KPI_Card title="Concluídos" value={timelineMetrics.concluidos} icon={CheckSquare} />
                  <KPI_Card title="Em Andamento" value={timelineMetrics.emAndamento} icon={Loader} />
                  {isClient && <KPI_Card title="Dias Restantes" value={daysRemaining ?? '--'} icon={Clock} />}
                  <KPI_Card title="Atrasados" value={timelineMetrics.atrasados} icon={XSquare} />
              </div>
              
              <InfoCard title="Gráfico de Gantt" icon={Calendar}>
                  {isClient && ganttTasks.length > 0 ? (
                      <Gantt
                        tasks={ganttTasks}
                        viewMode={ViewMode.Month}
                        listCellWidth="" 
                        ganttHeight={300}
                        rowHeight={50}
                        columnWidth={75}
                        barBackgroundColor="#e4e4e7"
                        barProgressColor="#3b82f6"
                        barProgressSelectedColor="#2563eb"
                        arrowColor="gray"
                        todayColor="rgba(239, 68, 68, 0.2)"
                        fontFamily="inherit"
                        fontSize="14px"
                      />
                  ) : <p className="text-gray-500 py-8 text-center">Nenhum marco cadastrado para este projeto.</p>}
              </InfoCard>

              <InfoCard title="Marcos e Entregas" icon={CheckSquare}>
                  <div className="space-y-4">
                      {milestones.length > 0 ? milestones.map(milestone => (
                          <div key={milestone.id} className="p-4 border rounded-lg hover:bg-gray-50/50 transition-colors">
                              <div className="flex justify-between items-center mb-2">
                                  <p className="font-medium text-gray-800">{milestone.title}</p>
                                  <span className="text-sm text-gray-500">{formatDate(milestone.due_date)}</span>
                              </div>
                               <div className="text-sm text-gray-500 mb-2">Responsável: {milestone.team_member?.full_name || 'N/A'}</div>
                              <div>
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                      <span>Progresso</span>
                                      <span>{milestone.progress_percentage}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-blue-600 h-2 rounded-full" style={{width: `${milestone.progress_percentage}%`}}></div>
                                  </div>
                              </div>
                          </div>
                      )) : <p className="text-gray-500 py-8 text-center">Nenhum marco cadastrado.</p>}
                  </div>
              </InfoCard>
          </div>
        )}

        {(activeTab === 'risks' || activeTab === 'deliverables') && (
          <div className="text-center py-16 bg-white rounded-lg border">
            <h2 className="text-xl font-semibold">Em Desenvolvimento</h2>
            <p className="text-gray-600 mt-2">A aba de "{activeTab}" será implementada em breve.</p>
          </div>
        )}
      </div>
    </div>
  )
}