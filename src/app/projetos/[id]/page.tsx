// src/app/projetos/[id]/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Edit, AlertTriangle, Calendar, Users, DollarSign, 
  Target, BarChart3, CheckCircle, FileText, Code, Clock,
  CheckSquare, Loader, XSquare, Download, Trash2, BookOpen,
  ShieldAlert, ShieldCheck, ShieldOff, ShieldX, MessageSquare,
  ClipboardCheck, Mail, AlertCircle, Plus
} from 'lucide-react'
import { Gantt, Task, ViewMode } from 'gantt-task-react'
import "gantt-task-react/dist/index.css"
import EditProjectModal from '@/components/modals/EditProjectModal'
import DeliverableModal from '@/components/modals/DeliverableModal'

// --- Interfaces ---
interface ProjectDetails {
  id: string; name: string; description?: string; status: string; health: string;
  progress_percentage: number; total_budget: number; used_budget: number;
  start_date?: string; estimated_end_date?: string; risk_level: string;
  project_type: string; next_milestone?: string;
  client?: { id: string, company_name: string };
  manager?: { id: string, full_name: string };
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
interface ProjectCommunication {
  id: string; type: string; title: string; created_at: string;
  participants: string[]; content?: string; creator?: { full_name: string };
}

// --- Componentes de UI ---
const KPI_Card = ({ title, value, icon: Icon, subtitle }) => ( <div className="p-4 rounded-lg flex items-center gap-4 bg-white border border-gray-200">{Icon && <Icon className="w-6 h-6 text-gray-700" />}<div><p className="text-sm font-medium text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-900">{value}</p>{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}</div></div> );
const TimelineKPI_Card = ({ title, value, icon: Icon, iconColor }) => ( <div className="bg-white p-4 rounded-lg border flex items-center gap-3">{Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}<div><p className="text-xl font-bold">{value}</p><p className="text-sm text-gray-500">{title}</p></div></div> );
const InfoCard = ({ title, icon: Icon, children, actions = null }) => ( <div className="bg-white rounded-lg border border-gray-200 p-6"><div className="flex justify-between items-center mb-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">{Icon && <Icon className="w-5 h-5 text-gray-600" />}</div><h3 className="text-lg font-semibold text-gray-800">{title}</h3></div>{actions && <div>{actions}</div>}</div><div className="space-y-4">{children}</div></div> );
const InfoPair = ({ label, value }) => ( <div><p className="text-sm text-gray-500">{label}</p><p className="font-medium text-gray-800">{value || 'N/D'}</p></div> );
const RiskMatrix = ({ risks }) => { const probabilityLevels = ['Alta', 'Média', 'Baixa']; const impactLevels = ['Baixo', 'Médio', 'Alto', 'Crítico']; const getCellColor = (prob, imp) => { if (prob === 'Alta' && (imp === 'Alto' || imp === 'Crítico')) return 'bg-red-500'; if ((prob === 'Alta' && imp === 'Médio') || (prob === 'Média' && (imp === 'Alto' || imp === 'Crítico'))) return 'bg-orange-500'; if ((prob === 'Alta' && imp === 'Baixo') || (prob === 'Média' && imp === 'Médio') || (prob === 'Baixa' && (imp === 'Alto' || imp === 'Crítico'))) return 'bg-yellow-400'; return 'bg-green-500'; }; const riskMatrix = probabilityLevels.map(prob => impactLevels.map(imp => risks.filter(risk => risk.probability === prob && risk.impact === imp).length)); return (<div className="grid grid-cols-5 gap-1"><div className="font-semibold text-sm text-center text-gray-600 pb-2"></div>{impactLevels.map(imp => <div key={imp} className="font-semibold text-sm text-center text-gray-600 pb-2">{imp}</div>)}{riskMatrix.map((row, rowIndex) => (<><div key={probabilityLevels[rowIndex]} className="font-semibold text-sm text-right text-gray-600 pr-2 flex items-center justify-end">{probabilityLevels[rowIndex]}</div>{row.map((count, colIndex) => (<div key={`${rowIndex}-${colIndex}`} className={`h-12 rounded-md flex items-center justify-center text-white font-bold text-lg ${getCellColor(probabilityLevels[rowIndex], impactLevels[colIndex])}`}>{count > 0 ? count : ''}</div>))}</>))}</div>); };

// --- Página Principal ---
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [communications, setCommunications] = useState<ProjectCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<ProjectDeliverable | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (projectId) loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const projectPromise = supabase.from('projects').select(`*, client:clients(id, company_name), manager:team_members(id, full_name), technologies:project_technologies(id, name), scope_items:project_scope(id, title, status), team_members:project_team_members(role_in_project, team_member:team_members(full_name, primary_specialization))`).eq('id', projectId).single();
      const milestonesPromise = supabase.from('project_milestones').select(`*, team_member:team_members(full_name), start_date`).eq('project_id', projectId).order('due_date');
      const deliverablesPromise = supabase.from('project_deliverables').select(`*, team_member:team_members(full_name)`).eq('project_id', projectId).order('created_at');
      const risksPromise = supabase.from('project_risks').select(`*, team_member:team_members(full_name)`).eq('project_id', projectId).order('created_at');
      const commsPromise = supabase.from('project_communications').select(`*, creator:team_members(full_name)`).eq('project_id', projectId).order('created_at', { ascending: false });
      
      const [ { data: pData, error: pError }, { data: mData, error: mError }, { data: dData, error: dError }, { data: rData, error: rError }, { data: cData, error: cError } ] = await Promise.all([projectPromise, milestonesPromise, deliverablesPromise, risksPromise, commsPromise]);

      if (pError) throw pError; if (mError) throw mError; if (dError) throw dError; if (rError) throw rError; if (cError) throw cError;
      
      setProject(pData);
      setMilestones(mData || []);
      setDeliverables(dData || []);
      setRisks(rData || []);
      setCommunications(cData || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccess = () => loadAllData();
  const handleAddNewDeliverable = () => { setEditingDeliverable(null); setIsDeliverableModalOpen(true); };
  const handleEditDeliverable = (deliverable) => { setEditingDeliverable(deliverable); setIsDeliverableModalOpen(true); };
  const handleDeleteDeliverable = async (deliverableId: string) => { if (window.confirm('Tem certeza que deseja excluir este entregável?')) { try { const { error } = await supabase.from('project_deliverables').delete().eq('id', deliverableId); if (error) throw error; alert('Entregável excluído com sucesso!'); handleSuccess(); } catch (error) { alert('Falha ao excluir o entregável.'); } } };

  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/D';
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  const getHealthConfig = (health: string) => { switch (health) { case 'Crítico': return { text: 'Crítico', color: 'bg-red-100 text-red-700', icon: AlertTriangle }; case 'Bom': return { text: 'Bom', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle }; default: return { text: 'Excelente', color: 'bg-green-100 text-green-700', icon: CheckCircle }; } };
  const getDeliverableStatusColor = (status: string) => { switch (status) { case 'Aprovado': return 'bg-green-100 text-green-800'; case 'Revisão': return 'bg-yellow-100 text-yellow-800'; case 'Rejeitado': return 'bg-red-100 text-red-800'; default: return 'bg-gray-100 text-gray-800'; } };
  const getRiskStatusColor = (status: string) => { switch (status) { case 'Ativo': return 'bg-red-100 text-red-800'; case 'Mitigado': return 'bg-yellow-100 text-yellow-800'; case 'Fechado': return 'bg-green-100 text-green-800'; default: return 'bg-gray-100 text-gray-800'; } };
  const getCommunicationIcon = (type: string) => { switch(type) { case 'Reunião': return <Users className="w-5 h-5 text-blue-600" />; case 'Decisão': return <ClipboardCheck className="w-5 h-5 text-green-600" />; case 'Email': return <Mail className="w-5 h-5 text-gray-600" />; case 'Escalação': return <AlertCircle className="w-5 h-5 text-red-600" />; default: return <MessageSquare className="w-5 h-5 text-gray-600" />; } };
  
  const healthConfig = project ? getHealthConfig(project.health) : null;
  const daysRemaining = project?.estimated_end_date ? Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  // **CORREÇÃO DA LÓGICA DE PROGRESSO**
  const actualProgress = useMemo(() => {
    if (!deliverables || deliverables.length === 0) {
      return 0;
    }
    const approvedCount = deliverables.filter(d => d.status === 'Aprovado').length;
    return Math.round((approvedCount / deliverables.length) * 100);
  }, [deliverables]);

  const ganttTasks: Task[] = milestones.map(m => ({ start: m.start_date ? new Date(m.start_date) : (m.due_date ? new Date(new Date(m.due_date).setDate(new Date(m.due_date).getDate() - 7)) : new Date()), end: m.due_date ? new Date(m.due_date) : new Date(), name: m.title, id: m.id, type: 'task', progress: m.progress_percentage, isDisabled: m.status === 'Concluído', }));
  const timelineMetrics = { concluidos: milestones.filter(m => m.status === 'Concluído').length, emAndamento: milestones.filter(m => m.status === 'Em Andamento').length, atrasados: milestones.filter(m => m.status === 'Atrasado').length, };
  const deliverableMetrics = { aprovados: deliverables.filter(d => d.status === 'Aprovado').length, emRevisao: deliverables.filter(d => d.status === 'Revisão').length, rascunhos: deliverables.filter(d => d.status === 'Rascunho').length, total: deliverables.length, };
  const riskMetrics = { ativos: risks.filter(r => r.status === 'Ativo').length, mitigados: risks.filter(r => r.status === 'Mitigado').length, ocorridos: risks.filter(r => r.status === 'Ocorrido').length };
  const commsMetrics = { reunioes: communications.filter(c => c.type === 'Reunião').length, decisoes: communications.filter(c => c.type === 'Decisão').length, escalacoes: communications.filter(c => c.type === 'Escalação').length, };

  if (loading) { return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>; }
  if (error || !project) { return <div className="min-h-screen bg-gray-50 p-6"><div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8"><h2 className="text-xl font-semibold text-red-800 mb-4">❌ Erro ao Carregar Projeto</h2><pre className="bg-red-100 text-red-700 p-4 rounded-md text-sm">{error || "Projeto não encontrado."}</pre><button onClick={() => router.push('/projetos')} className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Voltar para a Lista</button></div></div>; }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6"><button onClick={() => router.push('/projetos')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /><span className="font-medium">Voltar</span></button><div className="flex items-center gap-3"><span className={`px-3 py-1 text-sm font-medium rounded-full ${healthConfig?.color}`}>{project.status}</span><button onClick={() => setIsEditModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700"><Edit className="w-4 h-4" />Editar Projeto</button></div></div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <KPI_Card title="Saúde" value={healthConfig?.text} icon={healthConfig?.icon} />
              <KPI_Card title="Progresso" value={`${actualProgress}%`} icon={BarChart3} />
              {isClient && <KPI_Card title="Dias Restantes" value={daysRemaining ?? '--'} icon={Clock} />}
              <KPI_Card title="Orçamento Usado" value={formatCurrency(project.used_budget)} icon={DollarSign} subtitle={`de ${formatCurrency(project.total_budget)}`} />
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto p-6">
          <div className="border-b border-gray-200 mb-6"><nav className="flex space-x-8"><button onClick={() => setActiveTab('overview')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Visão Geral</button><button onClick={() => setActiveTab('timeline')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cronograma</button><button onClick={() => setActiveTab('deliverables')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'deliverables' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Entregáveis</button><button onClick={() => setActiveTab('risks')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'risks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Riscos</button><button onClick={() => setActiveTab('communication')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'communication' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Comunicação</button></nav></div>

          {activeTab === 'overview' && ( <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6"><InfoCard title="Informações do Projeto" icon={Target}><p className="text-gray-700">{project.description}</p><div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t"><InfoPair label="Tipo" value={project.project_type} /><InfoPair label="Nível de Risco" value={project.risk_level} /><InfoPair label="Gerente" value={project.manager?.full_name} /><InfoPair label="Próximo Marco" value={project.next_milestone} /></div></InfoCard><InfoCard title="Cronograma" icon={Calendar}><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InfoPair label="Data de Início" value={formatDate(project.start_date)} /><InfoPair label="Previsão de Fim" value={formatDate(project.estimated_end_date)} /></div><div><p className="text-sm text-gray-500 mb-1">Progresso Geral</p><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${actualProgress}%`}}></div></div></div></InfoCard><InfoCard title="Tecnologias" icon={Code}><div className="flex flex-wrap gap-2">{project.technologies.filter(tech => tech.name).map(tech => (<span key={tech.id} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-full">{tech.name}</span>))}</div></InfoCard></div><div className="space-y-6"><InfoCard title="Informações Financeiras" icon={DollarSign}><InfoPair label="Orçamento Total" value={formatCurrency(project.total_budget)} /><InfoPair label="Valor Utilizado" value={formatCurrency(project.used_budget)} /><div><p className="text-sm text-gray-500 mb-1">Progresso Financeiro</p><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-green-600 h-2.5 rounded-full" style={{width: `${(project.used_budget / project.total_budget) * 100}%`}}></div></div></div></InfoCard><InfoCard title="Equipe Alocada" icon={Users}><div className="space-y-3">{project.team_members.map(member => (<div key={member.team_member.full_name} className="flex justify-between items-center"><div><p className="font-medium text-gray-800">{member.team_member.full_name}</p><p className="text-xs text-gray-500">{member.role_in_project || member.team_member.primary_specialization}</p></div></div>))}</div></InfoCard></div></div> )}
          {/* ...outras abas... */}
        </div>
      </div>
      <EditProjectModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} project={project} onSuccess={handleSuccess} />
      <DeliverableModal isOpen={isDeliverableModalOpen} onClose={() => setIsDeliverableModalOpen(false)} projectId={projectId} deliverable={editingDeliverable} onSuccess={handleSuccess} />
    </>
  )
}
