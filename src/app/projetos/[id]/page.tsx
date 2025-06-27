// src/app/projetos/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Edit, AlertTriangle, Calendar, Users, DollarSign, 
  Target, BarChart3, CheckCircle, FileText, Code, Clock,
  CheckSquare, Loader, XSquare, Download, Trash2, BookOpen,
  ShieldAlert, ShieldCheck, ShieldOff, ShieldX, MessageSquare,
  ClipboardCheck, Mail, AlertCircle
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

interface ProjectCommunication {
  id: string;
  type: string;
  title: string;
  created_at: string;
  participants: string[];
  content?: string;
  creator?: { full_name: string };
}

// --- Componentes de UI ---
const KPI_Card = ({ title, value, icon: Icon, subtitle }) => ( <div className="p-4 rounded-lg flex items-center gap-4 bg-white border border-gray-200">{Icon && <Icon className="w-6 h-6 text-gray-700" />}<div><p className="text-sm font-medium text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-900">{value}</p>{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}</div></div> );
const TimelineKPI_Card = ({ title, value, icon: Icon, iconColor }) => ( <div className="bg-white p-4 rounded-lg border flex items-center gap-3">{Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}<div><p className="text-xl font-bold">{value}</p><p className="text-sm text-gray-500">{title}</p></div></div> );
const InfoCard = ({ title, icon: Icon, children }) => ( <div className="bg-white rounded-lg border border-gray-200 p-6"><div className="flex items-center gap-3 mb-4"><div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">{Icon && <Icon className="w-5 h-5 text-gray-600" />}</div><h3 className="text-lg font-semibold text-gray-800">{title}</h3></div><div className="space-y-4">{children}</div></div> );
const InfoPair = ({ label, value }) => ( <div><p className="text-sm text-gray-500">{label}</p><p className="font-medium text-gray-800">{value || 'N/D'}</p></div> );
const RiskMatrix = ({ risks }) => { /* ...código mantido... */ };

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
      const commsPromise = supabase.from('project_communications').select(`*, creator:team_members(full_name)`).eq('project_id', projectId).order('created_at', { ascending: false });

      const [ { data: pData, error: pError }, { data: mData, error: mError }, { data: dData, error: dError }, { data: rData, error: rError }, { data: cData, error: cError } ] = await Promise.all([projectPromise, milestonesPromise, deliverablesPromise, risksPromise, commsPromise]);

      if (pError) throw pError;
      if (mError) throw mError;
      if (dError) throw dError;
      if (rError) throw rError;
      if (cError) throw cError;
      
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
  
  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/D';
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  const getHealthConfig = (health: string) => { /* ...código mantido... */ };
  const getDeliverableStatusColor = (status: string) => { /* ...código mantido... */ };
  const getRiskStatusColor = (status: string) => { /* ...código mantido... */ };
  const getCommunicationIcon = (type: string) => {
    switch(type) {
        case 'Reunião': return <Users className="w-5 h-5 text-blue-600" />;
        case 'Decisão': return <ClipboardCheck className="w-5 h-5 text-green-600" />;
        case 'Email': return <Mail className="w-5 h-5 text-gray-600" />;
        case 'Escalação': return <AlertCircle className="w-5 h-5 text-red-600" />;
        default: return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };
  
  const healthConfig = project ? getHealthConfig(project.health) : null;
  const daysRemaining = project?.estimated_end_date ? Math.ceil((new Date(project.estimated_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  const ganttTasks: Task[] = milestones.map(m => ({ /* ...código mantido... */ }));
  
  const timelineMetrics = { /* ...código mantido... */ };
  const deliverableMetrics = { /* ...código mantido... */ };
  const riskMetrics = { /* ...código mantido... */ };
  const commsMetrics = {
    reunioes: communications.filter(c => c.type === 'Reunião').length,
    decisoes: communications.filter(c => c.type === 'Decisão').length,
    escalacoes: communications.filter(c => c.type === 'Escalação').length,
  };

  if (loading) { return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>; }
  if (error || !project) { return <div className="min-h-screen bg-gray-50 p-6"><div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8"><h2 className="text-xl font-semibold text-red-800 mb-4">❌ Erro ao Carregar Projeto</h2><pre className="bg-red-100 text-red-700 p-4 rounded-md text-sm">{error || "Projeto não encontrado."}</pre><button onClick={() => router.push('/projetos')} className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Voltar para a Lista</button></div></div>; }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">{/* ...código do cabeçalho mantido... */}</div>
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="border-b border-gray-200 mb-6"><nav className="flex space-x-8"><button onClick={() => setActiveTab('overview')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Visão Geral</button><button onClick={() => setActiveTab('timeline')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cronograma</button><button onClick={() => setActiveTab('deliverables')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'deliverables' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Entregáveis</button><button onClick={() => setActiveTab('risks')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'risks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Riscos</button><button onClick={() => setActiveTab('communication')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'communication' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Comunicação</button></nav></div>

        {activeTab === 'overview' && ( <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{/* ...código mantido... */}</div> )}
        {activeTab === 'timeline' && ( <div className="space-y-6">{/* ...código mantido... */}</div> )}
        {activeTab === 'deliverables' && ( <div className="space-y-6">{/* ...código mantido... */}</div> )}
        {activeTab === 'risks' && ( <div className="space-y-6">{/* ...código mantido... */}</div> )}
        
        {activeTab === 'communication' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TimelineKPI_Card title="Reuniões" value={commsMetrics.reunioes} icon={Users} iconColor="text-blue-500" />
              <TimelineKPI_Card title="Decisões" value={commsMetrics.decisoes} icon={ClipboardCheck} iconColor="text-green-500" />
              <TimelineKPI_Card title="Escalações" value={commsMetrics.escalacoes} icon={AlertCircle} iconColor="text-red-500" />
            </div>

            <InfoCard title="Timeline de Comunicação" icon={MessageSquare}>
              <div className="space-y-6">
                {communications.length > 0 ? communications.map(comm => (
                  <div key={comm.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getCommunicationIcon(comm.type)}
                      </div>
                      <div className="flex-1 w-px bg-gray-200 my-2"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="font-medium text-gray-800">{comm.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(comm.created_at)} por {comm.creator?.full_name || 'Sistema'}
                      </p>
                      <div className="mt-2 text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p className="text-sm">{comm.content}</p>
                        {comm.participants && comm.participants.length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                                <strong>Participantes:</strong> {comm.participants.join(', ')}
                            </p>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 py-8 text-center">Nenhuma comunicação registrada.</p>
                )}
              </div>
            </InfoCard>
          </div>
        )}
      </div>
    </div>
  )
}
