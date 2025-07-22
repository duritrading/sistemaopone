// src/app/financeiro/components/NovaCategoriaModal.tsx - CORRIGIDO COMPLETO
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { X, Tag, Save, Info, Palette } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const categoriaSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(['receita', 'despesa']),
  color: z.string().min(1, 'Cor é obrigatória'),
  icon: z.string().min(1, 'Ícone é obrigatório'),
  description: z.string().optional()
})

type CategoriaFormData = z.infer<typeof categoriaSchema>

interface NovaCategoriaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: any
}

export default function NovaCategoriaModal({
  isOpen,
  onClose,
  onSuccess,
  editData
}: NovaCategoriaModalProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      type: 'despesa',
      color: '#ef4444',
      icon: 'tag',
      description: ''
    }
  })

  const selectedType = watch('type')
  const selectedColor = watch('color')
  const selectedIcon = watch('icon')

  const predefinedColors = [
    { value: '#ef4444', name: 'Vermelho' },
    { value: '#f97316', name: 'Laranja' },
    { value: '#f59e0b', name: 'Âmbar' },
    { value: '#eab308', name: 'Amarelo' },
    { value: '#84cc16', name: 'Verde Claro' },
    { value: '#22c55e', name: 'Verde' },
    { value: '#10b981', name: 'Esmeralda' },
    { value: '#14b8a6', name: 'Teal' },
    { value: '#06b6d4', name: 'Ciano' },
    { value: '#3b82f6', name: 'Azul' },
    { value: '#6366f1', name: 'Índigo' },
    { value: '#8b5cf6', name: 'Violeta' },
    { value: '#a855f7', name: 'Púrpura' },
    { value: '#d946ef', name: 'Fúcsia' },
    { value: '#ec4899', name: 'Rosa' },
    { value: '#f43f5e', name: 'Rosa Escuro' }
  ]

  const predefinedIcons = [
    { value: 'tag', name: 'Tag', emoji: '🏷️' },
    { value: 'dollar-sign', name: 'Dinheiro', emoji: '💰' },
    { value: 'shopping-cart', name: 'Compras', emoji: '🛒' },
    { value: 'home', name: 'Casa', emoji: '🏠' },
    { value: 'car', name: 'Transporte', emoji: '🚗' },
    { value: 'utensils', name: 'Alimentação', emoji: '🍽️' },
    { value: 'laptop', name: 'Tecnologia', emoji: '💻' },
    { value: 'heart', name: 'Saúde', emoji: '❤️' },
    { value: 'briefcase', name: 'Trabalho', emoji: '💼' },
    { value: 'graduation-cap', name: 'Educação', emoji: '🎓' },
    { value: 'plane', name: 'Viagem', emoji: '✈️' },
    { value: 'gift', name: 'Presentes', emoji: '🎁' },
    { value: 'zap', name: 'Energia', emoji: '⚡' },
    { value: 'phone', name: 'Comunicação', emoji: '📱' }
  ]

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setValue('name', editData.name || '')
        setValue('type', editData.type || 'despesa')
        setValue('color', editData.color || '#ef4444')
        setValue('icon', editData.icon || 'tag')
        setValue('description', editData.description || '')
      }
    } else {
      reset()
    }
  }, [isOpen, editData, setValue, reset])

  const onSubmit = async (data: CategoriaFormData) => {
    try {
      setLoading(true)

      const categoryData = {
        name: data.name.trim(),
        type: data.type,
        color: data.color,
        icon: data.icon,
        description: data.description?.trim() || null,
        is_active: true
      }

      if (editData) {
        const { error } = await supabase
          .from('custom_categories')
          .update(categoryData)
          .eq('id', editData.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('custom_categories')
          .insert([categoryData])

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert('Erro ao salvar categoria')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white relative">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: selectedColor + '20' }}
            >
              <Tag 
                className="w-5 h-5" 
                style={{ color: selectedColor }}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editData ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <p className="text-sm text-gray-500">
                {editData ? 'Atualize os dados da categoria' : 'Crie uma nova categoria personalizada'}
              </p>
            </div>
          </div>
          
          {/* Botão X corrigido */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10 text-gray-600 hover:text-gray-800"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Nome e Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Ex: Marketing Digital"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
                {errors.type && (
                  <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Descrição opcional da categoria..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent resize-none"
              />
            </div>

            {/* Seleção de Cor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cor da Categoria *
              </label>
              <div className="grid grid-cols-8 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue('color', color.value)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {selectedColor === color.value && (
                      <div className="w-full h-full rounded-md flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Input personalizado para cor */}
              <div className="mt-3 flex items-center space-x-3">
                <input
                  type="color"
                  {...register('color')}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">Ou escolha uma cor personalizada</span>
              </div>
            </div>

            {/* Seleção de Ícone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ícone da Categoria *
              </label>
              <div className="grid grid-cols-7 gap-2">
                {predefinedIcons.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setValue('icon', icon.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      selectedIcon === icon.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    title={icon.name}
                  >
                    <span className="text-lg">{icon.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedColor }}
                >
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {watch('name') || 'Nome da categoria'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span 
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedType === 'receita' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedType === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações de Ajuda */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Dica: Organizando Categorias</h3>
                  <p className="text-sm text-blue-700">
                    Use categorias específicas para melhor controle financeiro. Por exemplo, ao invés de apenas 
                    "Despesas", crie "Marketing Digital", "Marketing Tradicional", etc. Isso facilita relatórios 
                    detalhados e análises de gastos por área.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Salvando...' : (editData ? 'Atualizar' : 'Salvar')} Categoria
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}