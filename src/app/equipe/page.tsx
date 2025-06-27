// src/app/equipe/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import NewMemberModal from '@/components/modals/NewMemberModal'
import EditMemberModal from '@/components/modals/EditMemberModal'
import { supabase } from '@/lib/supabase'
import { 
  Plus, 
  Search, 
  Filter,
  Mail,
  MapPin,
  Clock,
  FolderOpen,
  User,
  Edit2,
  Trash2,
  MoreVertical
} from 'lucide-react'

// Types
type TeamMember = {
  id: string
  full_name: string
  email: string
  profile_photo_url: string | null
  seniority_level: 'Trainee' | 'Junior' | 'Pleno' | 'Sênior' | 'Principal'
  primary_specialization: 'Machine Learning/IA' | 'Ciência de Dados' | 'Backend' | 'Frontend' | 'DevOps' | 'Produto' | 'QA' | 'UX/UI'
  work_modality: 'Presencial' | 'Remoto' | 'Híbrido'
  availability_status: 'Disponível' | 'Parcial' | 'Ocupado' | 'Férias' | 'Afastamento médico'
  allocation_percentage: number
  last_access: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type Filters = {
  seniority: string[]
  specialization: string[]
  availability: string[]
  search: string
}

const seniorityLevels = ['Trainee', 'Junior', 'Pleno', 'Sênior', 'Principal']
const specializations = [
  'Machine Learning/IA', 
  'Ciência de Dados', 
  'Backend', 
  'Frontend', 
  'DevOps', 
  'Produto', 
  'QA', 
  'UX/UI'
]
const availabilityStatuses = ['Disponível', 'Parcial', 'Ocupado', 'Férias', 'Afastamento médico']

const getAvailabilityColor = (status: string, percentage: number) => {
  switch (status) {
    case 'Disponível': return 'bg-green-100 text-green-800'
    case 'Parcial': return 'bg-yellow-100 text-yellow-800'
    case 'Ocupado': return 'bg-red-100 text-red-800'
    case 'Férias': return 'bg-blue-100 text-blue-800'
    case 'Afastamento médico': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function EquipePage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showNewMemberModal, setShowNewMemberModal] = useState(false)
  const [showEditMemberModal, setShowEditMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [deletingMember, setDeletingMember] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    seniority: [],
    specialization: [],
    availability: [],
    search: ''
  })

  // Counters for filters
  const [counts, setCounts] = useState({
    seniority: {} as Record<string, number>,
    specialization: {} as Record<string, number>,
    availability: {} as Record<string, number>
  })

  // Fetch team members
  useEffect(() => {
    fetchTeamMembers()
  }, [])

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [teamMembers, filters])

  // Calculate counts
  useEffect(() => {
    calculateCounts()
  }, [teamMembers])

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Erro ao buscar membros:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateCounts = () => {
    const newCounts = {
      seniority: {} as Record<string, number>,
      specialization: {} as Record<string, number>,
      availability: {} as Record<string, number>
    }

    teamMembers.forEach(member => {
      // Count seniority
      newCounts.seniority[member.seniority_level] = 
        (newCounts.seniority[member.seniority_level] || 0) + 1

      // Count specialization
      newCounts.specialization[member.primary_specialization] = 
        (newCounts.specialization[member.primary_specialization] || 0) + 1

      // Count availability
      newCounts.availability[member.availability_status] = 
        (newCounts.availability[member.availability_status] || 0) + 1
    })

    setCounts(newCounts)
  }

  const applyFilters = () => {
    let filtered = teamMembers

    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        member.email.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Filter by seniority
    if (filters.seniority.length > 0) {
      filtered = filtered.filter(member =>
        filters.seniority.includes(member.seniority_level)
      )
    }

    // Filter by specialization
    if (filters.specialization.length > 0) {
      filtered = filtered.filter(member =>
        filters.specialization.includes(member.primary_specialization)
      )
    }

    // Filter by availability
    if (filters.availability.length > 0) {
      filtered = filtered.filter(member =>
        filters.availability.includes(member.availability_status)
      )
    }

    setFilteredMembers(filtered)
  }

  const handleFilterChange = (type: keyof Filters, value: string) => {
    if (type === 'search') {
      setFilters(prev => ({ ...prev, search: value }))
      return
    }

    setFilters(prev => {
      const currentFilter = prev[type] as string[]
      const newFilter = currentFilter.includes(value)
        ? currentFilter.filter(item => item !== value)
        : [...currentFilter, value]

      return { ...prev, [type]: newFilter }
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setShowEditMemberModal(true)
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return
    
    setDeletingMember(memberId)
    
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', memberId)

      if (error) throw error
      
      // Refresh the list
      fetchTeamMembers()
    } catch (error) {
      console.error('Erro ao excluir membro:', error)
      alert('Erro ao excluir membro. Tente novamente.')
    } finally {
      setDeletingMember(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
            <p className="mt-2 text-gray-700">
              Gerencie os membros da sua equipe de consultoria
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setShowNewMemberModal(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Membro
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Seniority Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Senioridade</h4>
                  <div className="space-y-2">
                    {seniorityLevels.map(level => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={filters.seniority.includes(level)}
                          onChange={() => handleFilterChange('seniority', level)}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {level} ({counts.seniority[level] || 0})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Specialization Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Especialização</h4>
                  <div className="space-y-2">
                    {specializations.map(spec => (
                      <label key={spec} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={filters.specialization.includes(spec)}
                          onChange={() => handleFilterChange('specialization', spec)}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {spec} ({counts.specialization[spec] || 0})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Disponibilidade</h4>
                  <div className="space-y-2">
                    {availabilityStatuses.map(status => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={filters.availability.includes(status)}
                          onChange={() => handleFilterChange('availability', status)}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {status} ({counts.availability[status] || 0})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Mostrando {filteredMembers.length} de {teamMembers.length} membros
          </p>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map(member => (
            <div key={member.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start space-x-4">
                {/* Profile Photo */}
                <div className="flex-shrink-0">
                  {member.profile_photo_url ? (
                    <img
                      src={member.profile_photo_url}
                      alt={member.full_name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {member.full_name}
                  </h3>
                  <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="text-sm text-gray-600 truncate">{member.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditMember(member)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                    title="Editar membro"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    disabled={deletingMember === member.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Excluir membro"
                  >
                    {deletingMember === member.id ? (
                      <div className="h-4 w-4 animate-spin border-2 border-red-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 space-y-3">
                {/* Seniority & Specialization */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">SENIORIDADE</span>
                    <span className="text-sm font-medium text-gray-900">{member.seniority_level}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-medium text-gray-500">ESPECIALIZAÇÃO</span>
                    <span className="text-sm text-gray-700">{member.primary_specialization}</span>
                  </div>
                </div>

                {/* Work Modality */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">MODALIDADE</span>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-700">{member.work_modality}</span>
                  </div>
                </div>

                {/* Availability Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">STATUS</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(member.availability_status, member.allocation_percentage)}`}>
                    {member.availability_status} ({member.allocation_percentage}%)
                  </span>
                </div>

                {/* Last Access */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">ÚLTIMO ACESSO</span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-700">{formatDate(member.last_access)}</span>
                  </div>
                </div>

                {/* Projects Allocated (placeholder) */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">PROJETOS</span>
                  <div className="flex items-center">
                    <FolderOpen className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-700">-</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum membro encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar seus filtros ou adicione um novo membro à equipe.
            </p>
          </div>
        )}
      </div>

      {/* New Member Modal */}
      <NewMemberModal 
        isOpen={showNewMemberModal}
        onClose={() => setShowNewMemberModal(false)}
        onSuccess={() => {
          fetchTeamMembers() // Refresh list
        }}
      />

      {/* Edit Member Modal */}
      <EditMemberModal 
        isOpen={showEditMemberModal}
        member={editingMember}
        onClose={() => {
          setShowEditMemberModal(false)
          setEditingMember(null)
        }}
        onSuccess={() => {
          fetchTeamMembers() // Refresh list
        }}
      />
    </DashboardLayout>
  )
}