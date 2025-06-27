// src/components/modals/EditProjectModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { X, Info, Calendar, DollarSign, FileText, Save } from 'lucide-react'

// Tipos
interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onSuccess: () => void;
}

interface TeamMember {
  id: string;
  full_name: string;
}

interface Client {
    id: string;
    company_name: string;
}

export default function EditProjectModal({ isOpen, onClose, project, onSuccess }: EditProjectModalProps) {
  const { register, handleSubmit, setValue } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: members, error: membersError } = await supabase.from('team_members').select('id, full_name').eq('is_active', true);
      if (membersError) console.error('Error fetching team members:', membersError);
      else setTeamMembers(members || []);

      const { data: clientsData, error: clientsError } = await supabase.from('clients').select('id, company_name').eq('is_active', true);
      if (clientsError) console.error('Error fetching clients:', clientsError);
      else setClients(clientsData || []);
    };
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (project && isOpen) {
      Object.keys(project).forEach(key => {
        if (key === 'start_date' || key === 'estimated_end_date') {
            const dateValue = project[key] ? new Date(project[key]).toISOString().split('T')[0] : '';
            setValue(key, dateValue);
        } else {
            setValue(key, project[key]);
        }
      });
      setValue('client_id', project.client?.id);
      setValue('manager_id', project.manager?.id);
    }
  }, [project, isOpen, setValue]);
  
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // **CORREÇÃO PRINCIPAL AQUI**
      // Construímos o objeto de atualização manualmente para garantir que apenas
      // os campos corretos da tabela 'projects' sejam enviados.
      const updateData = {
        name: data.name,
        description: data.description,
        status: data.status,
        health: data.health,
        risk_level: data.risk_level,
        project_type: data.project_type,
        manager_id: data.manager_id,
        start_date: data.start_date || null,
        estimated_end_date: data.estimated_end_date || null,
        progress_percentage: data.progress_percentage,
        next_milestone: data.next_milestone,
        total_budget: data.total_budget,
        used_budget: data.used_budget,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id);

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      alert('Projeto atualizado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      alert('Falha ao atualizar o projeto. Verifique o console para mais detalhes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const FormSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-gray-500" />
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );

  const FormField = ({ label, children, fullWidth = false }) => (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );

  const Input = (props) => <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" />;
  const Select = (props) => <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-white" />;
  const TextArea = (props) => <textarea {...props} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" />;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-50 rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-6 border-b bg-white rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">Editar Projeto</h2>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Alterações</>}
            </button>
          </div>
        </header>

        <form className="p-6 space-y-6 overflow-y-auto">
            <FormSection title="Informações Básicas" icon={Info}>
                <FormField label="Nome do Projeto" fullWidth><Input {...register('name')} /></FormField>
                <FormField label="Cliente"><Input value={project.client?.company_name || 'N/A'} readOnly className="bg-gray-100 cursor-not-allowed" /></FormField>
                <FormField label="Gerente de Projeto"><Select {...register('manager_id')}><option value="">Selecione</option>{teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}</Select></FormField>
                <FormField label="Tipo"><Select {...register('project_type')}><option>MVP</option><option>PoC</option><option>Implementação</option><option>Consultoria</option></Select></FormField>
                <FormField label="Status"><Select {...register('status')}><option>Planejamento</option><option>Executando</option><option>Pausado</option><option>Concluído</option><option>Cancelado</option></Select></FormField>
                <FormField label="Saúde"><Select {...register('health')}><option>Excelente</option><option>Bom</option><option>Crítico</option></Select></FormField>
                <FormField label="Risco"><Select {...register('risk_level')}><option>Baixo</option><option>Médio</option><option>Alto</option></Select></FormField>
            </FormSection>

            <FormSection title="Cronograma e Orçamento" icon={Calendar}>
                 <FormField label="Data Início"><Input type="date" {...register('start_date')} /></FormField>
                 <FormField label="Previsão Fim"><Input type="date" {...register('estimated_end_date')} /></FormField>
                 <FormField label="Progresso (%)"><Input type="number" {...register('progress_percentage', { valueAsNumber: true })} /></FormField>
                 <FormField label="Próximo Marco"><Input {...register('next_milestone')} /></FormField>
                 <FormField label="Orçamento (R$)"><Input type="number" step="0.01" {...register('total_budget', { valueAsNumber: true })} /></FormField>
                 <FormField label="Valor Usado (R$)"><Input type="number" step="0.01" {...register('used_budget', { valueAsNumber: true })} /></FormField>
            </FormSection>

             <FormSection title="Detalhes do Projeto" icon={FileText}>
                <FormField label="Objetivo" fullWidth><TextArea {...register('description')} /></FormField>
            </FormSection>
        </form>
      </div>
    </div>
  );
}
