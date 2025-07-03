// src/app/financeiro/components/AttachmentsManager.tsx
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Upload, File, Image, FileText, Download, Trash2, 
  Eye, X, Plus, AlertCircle 
} from 'lucide-react'
import { useToast } from './Toast'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Attachment {
  id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  uploaded_at: string
}

interface AttachmentsManagerProps {
  transactionId: string
  attachments: Attachment[]
  onAttachmentsUpdate: (attachments: Attachment[]) => void
  readonly?: boolean
}

export function AttachmentsManager({ 
  transactionId, 
  attachments, 
  onAttachmentsUpdate,
  readonly = false 
}: AttachmentsManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const maxFileSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      if (!validateFile(file)) return
      uploadFile(file)
    })
  }

  const validateFile = (file: File): boolean => {
    if (file.size > maxFileSize) {
      showToast({
        type: 'error',
        title: 'Arquivo muito grande',
        message: `O arquivo "${file.name}" excede o limite de 10MB`
      })
      return false
    }

    if (!allowedTypes.includes(file.type)) {
      showToast({
        type: 'error',
        title: 'Tipo de arquivo não suportado',
        message: `O arquivo "${file.name}" não é um tipo suportado`
      })
      return false
    }

    return true
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${transactionId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transaction-attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('transaction-attachments')
        .getPublicUrl(fileName)

      // Save attachment record
      const attachment: Attachment = {
        id: Math.random().toString(36),
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: urlData.publicUrl,
        uploaded_at: new Date().toISOString()
      }

      const updatedAttachments = [...attachments, attachment]

      // Update transaction with new attachments
      const { error: updateError } = await supabase
        .from('financial_transactions')
        .update({ attachments: updatedAttachments })
        .eq('id', transactionId)

      if (updateError) throw updateError

      onAttachmentsUpdate(updatedAttachments)

      showToast({
        type: 'success',
        title: 'Arquivo anexado',
        message: `"${file.name}" foi anexado com sucesso`
      })

    } catch (err: any) {
      console.error('Erro ao fazer upload:', err)
      showToast({
        type: 'error',
        title: 'Erro no upload',
        message: 'Erro ao anexar arquivo: ' + err.message
      })
    } finally {
      setUploading(false)
    }
  }

  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm('Tem certeza que deseja remover este anexo?')) return

    try {
      const updatedAttachments = attachments.filter(att => att.id !== attachmentId)

      const { error } = await supabase
        .from('financial_transactions')
        .update({ attachments: updatedAttachments })
        .eq('id', transactionId)

      if (error) throw error

      onAttachmentsUpdate(updatedAttachments)

      showToast({
        type: 'success',
        title: 'Anexo removido',
        message: 'Arquivo removido com sucesso'
      })

    } catch (err: any) {
      console.error('Erro ao remover anexo:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao remover anexo: ' + err.message
      })
    }
  }

  const downloadAttachment = (attachment: Attachment) => {
    const link = document.createElement('a')
    link.href = attachment.file_url
    link.download = attachment.file_name
    link.target = '_blank'
    link.click()
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />
    if (fileType === 'application/pdf') return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!readonly) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!readonly && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Fazendo upload...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clique para anexar
                </button>
                <span className="text-gray-500"> ou arraste arquivos aqui</span>
              </div>
              <p className="text-xs text-gray-500">
                PDF, Imagens, Word, Excel até 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Anexos ({attachments.length})
          </h4>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="text-gray-500 flex-shrink-0">
                    {getFileIcon(attachment.file_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.file_size)} • {new Date(attachment.uploaded_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  {attachment.file_type.startsWith('image/') && (
                    <button
                      onClick={() => setPreviewFile(attachment)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => downloadAttachment(attachment)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {!readonly && (
                    <button
                      onClick={() => deleteAttachment(attachment.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && previewFile.file_type.startsWith('image/') && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewFile.file_url}
              alt={previewFile.file_name}
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 rounded-lg p-2">
              <p className="text-sm font-medium">{previewFile.file_name}</p>
              <p className="text-xs opacity-75">{formatFileSize(previewFile.file_size)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && readonly && (
        <div className="text-center py-6">
          <File className="w-8 h-8 text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Nenhum anexo encontrado</p>
        </div>
      )}
    </div>
  )
}

// Componente para uso em modais
export function AttachmentsModal({ 
  transactionId, 
  transactionDescription,
  onClose 
}: { 
  transactionId: string
  transactionDescription: string
  onClose: () => void 
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('attachments')
        .eq('id', transactionId)
        .single()

      if (error) throw error

      setAttachments(data.attachments || [])
    } catch (err) {
      console.error('Erro ao buscar anexos:', err)
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    fetchAttachments()
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Anexos da Transação</h2>
            <p className="text-sm text-gray-500 truncate">{transactionDescription}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando anexos...</p>
            </div>
          ) : (
            <AttachmentsManager
              transactionId={transactionId}
              attachments={attachments}
              onAttachmentsUpdate={setAttachments}
            />
          )}
        </div>
      </div>
    </div>
  )
}