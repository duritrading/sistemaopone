import { supabase } from '@/lib/supabase'

// Versão simplificada do container para corrigir o erro
export function createFinancialContainer() {
  return {
    supabase,
    // Adicione outros serviços conforme necessário
  }
}