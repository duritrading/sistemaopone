// src/app/projetos/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Edit, AlertTriangle, Calendar, Users, DollarSign, 
  Target, BarChart3, CheckCircle, FileText, Code, Clock,
  CheckSquare, Loader, XSquare, Download, Trash2, BookOpen,
  ShieldAlert, ShieldCheck, ShieldOff, ShieldX
} from 'lucide-react'
import { Gantt, Task, ViewMode } from 'gantt-task-react'
import "gantt-task-react/dist/index.css"

// --- Interfaces ---
interface ProjectDetails {
  id: string; name: string; description?: string; status: string; health: string;
  progress_percentage: number; total_budget: number; used_budget: number;
  start_date?: string; estimated_end_date?: string; risk_level: string;
  project_type: string; next_milestone?: string;
  client?: { company_name: string };
  manager?: { full_name: string };
  technologies: { id: string, name: string }[];
  team_members: { role_in_project: string; team_member: { full_name: string; primary_specialization: string; } }[];
  scope_items: { id: string, title: string, status: string }[];
}

interface ProjectMilestone {
  id: string; title: string; due_date?: string; start_date?: string; status: string;
  progress_percentage: number; team_member?: { full_name: string };
}

interface ProjectDeliverable {
  id: string; title: string; description?: string; type: string; version: string;
  status: string; due_date?: string; team_member?: { full_name: string };
}

interface ProjectRisk {
  id: string; title: string; probability: 'Baixa' | 'Média' | 'Alta'; impact: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'; status: string;
  team_member?: { full_name: string };
}

// --- Componentes de UI ---
const KPI_Card = ({ title, value, icon: Icon, subtitle }) => ( <div className="p-4 rounded-lg flex items-center gap-4 bg-white border border-gray-200">{Icon && <Icon className="w-6 h-6 text-gray-700" />}<div><p className="text-sm font-medium text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-900">{value}</p>{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}</div></div> );
const TimelineKPI_Card = ({ title, value, icon: Icon, iconColor }) => ( <div className="bg-white p-4 rounded-lg border flex items-center gap-3">{Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}<div><p className="text-xl font-bold">{value}</p><p className="text-sm text-gray-500">{title}</p></div></div> );
const InfoCard = ({ title, icon: Icon, children }) => ( <div className="bg-white rounded-lg border border-gray-200 p-6"><div className="flex items-center gap-3 mb-4"><div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">{Icon && <Icon className="w-5 h-5 text-gray-600" />}</div><h3 className="text-lg font-semibold text-gray-800">{title}</h3></div><div className="space-y-4">{children}</div></div> );
const InfoPair = ({ label, value }) => ( <div><p className="text-sm text-gray-500">{label}</p><p className="font-medium text-gray-800">{value || 'N/D'}</p></div> );

// --- NOVO COMPONENTE: Matriz de Risco ---
const RiskMatrix = ({ risks }) => {
  const probabilityLevels = ['Alta', 'Média', 'Baixa'];
  const impactLevels = ['Baixo', 'Médio', 'Alto', 'Crítico'];

  const getCellColor = (prob, imp) => {
    if (prob === 'Alta' && (imp === 'Alto' || imp === 'Crítico')) return 'bg-red-500';
    if ((prob === 'Alta' && imp === 'Médio') || (prob === 'Média' && (imp === 'Alto' || imp === 'Crítico'))) return 'bg-orange-500';
    if ((prob === 'Alta' && imp === 'Baixo') || (prob === 'Média' && imp === 'Médio') || (prob === 'Baixa' && (imp === 'Alto' || imp === 'Crítico'))) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const riskMatrix = probabilityLevels.map(prob =>
    impactLevels.map(imp =>
      risks.filter(risk => risk.probability === prob && risk.impact === imp).length
    )
  );

  return (
    <div className="grid grid-cols-5 gap-1">
      <div></div> {/* Canto vazio */}
      {impactLevels.map(imp => <div key={imp} className="font-semibold text-sm text-center text-gray-600 pb-2">{imp}</div>)}
      
      {riskMatrix.map((row, rowIndex) => (
        <>
          <div className="font-semibold text-sm text-right text-gray-600 pr-2 flex items-center justify-end">{probabilityLevels[rowIndex]}</div>
          {row.map((count, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className={`h-12 rounded-md flex items-center justify-center text-white font-bold text-lg ${getCellColor(probabilityLevels[rowIndex], impactLevels[colIndex])}`}>
              {count > 0 ? count : ''}
            </div>
          ))}
        </>
      ))}
    </div>
  );
};

// --- Página Principal ---
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (projectId) loadProjectDetails();
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      const projectPromise = supabase.from('projects').select(`*, client:clients(company_name), manager:team_members(full_name), technologies:project_technologies(id, name), scope_items:project_scope(id, title, status), team_members:project_team_members(role_in_project, team_member:team_members(full_name, primary_specialization))`).eq('id', projectId).single();
      const milestonesPromise = supabase.from('project_milestones').select(`*, team_member:team_members(full_name), start_date`).eq('project_id', projectId).order('due_date');
      const deliverablesPromise = supabase.from('project_deliverables').select(`*, team_member:team_members(full_name)`).eq('project_id', projectId).order('created_at');
      const risksPromise = supabase.from('project_risks').select(`*, team_member:team_members(full_name)`).eq('project_id', projectId).order('created_at');

      const [ { data: pData, error: pError }, { data: mData, error: mError }, { data: dData, error: dError }, { data: rData, error: rError } ] = await Promise.all([projectPromise, milestonesPromise, deliverablesPromise, risksPromise]);

      if (pError) throw pError;
      if (mError) throw mError;
      if (dError) throw dError;
      if (rError) throw rError;
      
      setProject(pData);
      setMilestones(mData || []);
      setDeliverables(dData || []);
      setRisks(rData || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/D';
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  const getHealthConfig = (health: string) => { switch (health) { case 'Crítico': return { text: 'Crítico', color: 'bg-red-100 text-red-700', icon: AlertTriangle }; case 'Bom': return { text: 'Bom', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle }; default: return { text: 'Excelente', color: 'bg-green-100 text-green-700', icon: CheckCircle }; } };
  const getDeliverableStatusColor = (status: string) => { switch (status) { case 'Aprovado': return 'bg-green-100 text-green-800'; case 'Revisão': return 'bg-yellow-100 text-yellow-800'; case 'Rejeitado': return 'bg-red-100 text-red-800'; default: return 'bg-gray-100 text-gray-800'; } };
  const getRiskStatusColor = (status: string) => { switch (status) { case 'Ativo': return 'bg-red-100 text-red-800'; case 'Mitigado': return 'bg-yellow-100 text-yellow-800'; case 'Fechado': return 'bg-green-100 text-green-800'; default: return 'bg-gray-100 text-gray-800'; } };
  
  const healthConfig = project ? getHealthConfig(project.health) : null;
  const daysRemaining = project?.estimated_end_date ? Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  const ganttTasks: Task[] = milestones.map(m => ({ start: m.start_date ? new Date(m.start_date) : (m.due_date ? new Date(new Date(m.due_date).setDate(new Date(m.due_date).getDate() - 7)) : new Date()), end: m.due_date ? new Date(m.due_date) : new Date(), name: m.title, id: m.id, type: 'task', progress: m.progress_percentage, isDisabled: m.status === 'Concluído', }));
  
  const timelineMetrics = { concluidos: milestones.filter(m => m.status === 'Concluído').length, emAndamento: milestones.filter(m => m.status === 'Em Andamento').length, atrasados: milestones.filter(m => m.status === 'Atrasado').length, };
  const deliverableMetrics = { aprovados: deliverables.filter(d => d.status === 'Aprovado').length, emRevisao: deliverables.filter(d => d.status === 'Revisão').length, rascunhos: deliverables.filter(d => d.status === 'Rascunho').length, total: deliverables.length, };
  const riskMetrics = { ativos: risks.filter(r => r.status === 'Ativo').length, mitigados: risks.filter(r => r.status === 'Mitigado').length, ocorridos: risks.filter(r => r.status === 'Ocorrido').length };

  if (loading) { return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>; }
  if (error || !project) { return <div className="min-h-screen bg-gray-50 p-6"><div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8"><h2 className="text-xl font-semibold text-red-800 mb-4">❌ Erro ao Carregar Projeto</h2><pre className="bg-red-100 text-red-700 p-4 rounded-md text-sm">{error || "Projeto não encontrado."}</pre><button onClick={() => router.push('/projetos')} className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Voltar para a Lista</button></div></div>; }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6"><button onClick={() => router.push('/projetos')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /><span className="font-medium">Voltar</span></button><div className="flex items-center gap-3"><span className={`px-3 py-1 text-sm font-medium rounded-full ${healthConfig?.color}`}>{project.status}</span><button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700"><Edit className="w-4 h-4" />Editar Projeto</button></div></div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"><KPI_Card title="Saúde" value={healthConfig?.text} icon={healthConfig?.icon} /><KPI_Card title="Progresso" value={`${project.progress_percentage}%`} icon={BarChart3} />{isClient && <KPI_Card title="Dias Restantes" value={daysRemaining ?? '--'} icon={Clock} />}<KPI_Card title="Orçamento Usado" value={formatCurrency(project.used_budget)} icon={DollarSign} subtitle={`de ${formatCurrency(project.total_budget)}`} /></div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="border-b border-gray-200 mb-6"><nav className="flex space-x-8"><button onClick={() => setActiveTab('overview')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Visão Geral</button><button onClick={() => setActiveTab('timeline')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cronograma</button><button onClick={() => setActiveTab('deliverables')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'deliverables' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Entregáveis</button><button onClick={() => setActiveTab('risks')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'risks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Riscos</button><button onClick={() => setActiveTab('communication')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'communication' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Comunicação</button></nav></div>

        {activeTab === 'overview' && ( <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{/* ...código mantido... */}</div> )}
        {activeTab === 'timeline' && ( <div className="space-y-6">{/* ...código mantido... */}</div> )}
        {activeTab === 'deliverables' && ( <div className="space-y-6">{/* ...código mantido... */}</div> )}
        
        {activeTab === 'risks' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <TimelineKPI_Card title="Riscos Ativos" value={riskMetrics.ativos} icon={ShieldAlert} iconColor="text-red-500" />
                <TimelineKPI_Card title="Riscos Mitigados" value={riskMetrics.mitigados} icon={ShieldCheck} iconColor="text-yellow-500" />
                <TimelineKPI_Card title="Ocorridos" value={riskMetrics.ocorridos} icon={ShieldX} iconColor="text-gray-500" />
            </div>
            <InfoCard title="Matriz de Probabilidade vs Impacto" icon={ShieldAlert}>
                <RiskMatrix risks={risks} />
            </InfoCard>
             <InfoCard title="Lista de Riscos" icon={FileText}>
                <div className="divide-y divide-gray-200">
                    {risks.length > 0 ? risks.map(risk => (
                        <div key={risk.id} className="p-4 hover:bg-gray-50/50 flex justify-between items-center">
                            <div className="flex-1">
                                <p className="font-medium text-gray-800">{risk.title}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span>Impacto: <span className="font-semibold">{risk.impact}</span></span>
                                    <span>Probabilidade: <span className="font-semibold">{risk.probability}</span></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRiskStatusColor(risk.status)}`}>{risk.status}</span>
                                <span className="text-sm text-gray-700 font-medium">{risk.team_member?.full_name || 'N/A'}</span>
                                <div className="flex gap-1">
                                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md" title="Editar"><Edit className="w-4 h-4" /></button>
                                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-gray-500 py-8 text-center">Nenhum risco cadastrado para este projeto.</p>}
                </div>
            </InfoCard>
          </div>
        )}

        {activeTab === 'communication' && ( <div className="text-center py-16 bg-white rounded-lg border"><h2 className="text-xl font-semibold">Em Desenvolvimento</h2><p className="text-gray-600 mt-2">A aba de "Comunicação" será implementada em breve.</p></div> )}
      </div>
    </div>
  )
}
