// src/components/modals/DeliverableModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { X, Save } from 'lucide-react'

type FormValues = {
  title: string;
  type: string;
  status: string;
  version: string;
  due_date: string;
  description: string;
};

interface DeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  deliverable?: any;
  onSuccess: () => void;
}

export default function DeliverableModal({ isOpen, onClose, projectId, deliverable, onSuccess }: DeliverableModalProps) {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!deliverable;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && deliverable) {
        setValue('title', deliverable.title || '');
        setValue('type', deliverable.type || 'Documento');
        setValue('status', deliverable.status || 'Rascunho');
        setValue('version', deliverable.version || 'v1.0');
        setValue('due_date', deliverable.due_date ? new Date(deliverable.due_date).toISOString().split('T')[0] : '');
        setValue('description', deliverable.description || '');
      } else {
        reset({
          title: '', type: 'Documento', status: 'Rascunho',
          version: 'v1.0', due_date: '', description: ''
        });
      }
    }
  }, [deliverable, isOpen, setValue, reset, isEditing]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        project_id: projectId,
        title: data.title,
        type: data.type,
        status: data.status,
        version: data.version,
        due_date: data.due_date || null,
        description: data.description || null,
      };

      let response;

      if (isEditing) {
        response = await supabase
          .from('project_deliverables')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', deliverable.id);
      } else {
        response = await supabase
          .from('project_deliverables')
          .insert([payload]);
      }

      if (response.error) {
        throw response.error;
      }

      alert(`Entregável ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error(`Erro ao salvar entregável:`, error);
      alert(`Falha ao salvar o entregável: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  
  const Input = (props) => <input {...props} className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-500 ${props.className || ''}`} />;
  const Select = (props) => <select {...props} className={`w-full px-3 py-2 border rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 ${props.className || ''}`} />;
  const TextArea = (props) => <textarea {...props} rows={4} className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-500 ${props.className || ''}`} />;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{isEditing ? 'Editar Entregável' : 'Novo Entregável'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-600" /></button>
        </header>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Entregável</label>
              <Input {...register('title', { required: 'O nome é obrigatório' })} placeholder="Ex: Documento de Requisitos" className={errors.title ? 'border-red-500' : 'border-gray-300'} />
              {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <Select {...register('type')}>
                  <option>Documento</option>
                  <option>Código</option>
                  <option>Design</option>
                  <option>Relatório</option>
                  <option>Apresentação</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select {...register('status')}>
                  <option>Rascunho</option>
                  <option>Revisão</option>
                  <option>Aprovado</option>
                  <option>Rejeitado</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Versão</label>
                <Input {...register('version')} defaultValue="v1.0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrega</label>
                <Input type="date" {...register('due_date')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <TextArea {...register('description')} placeholder="Descreva o que este item representa..." />
            </div>
          </div>
          <footer className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}