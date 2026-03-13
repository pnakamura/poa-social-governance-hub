import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PepTarefa {
  id: string
  pep_entry_id: string
  titulo: string
  fase: string
  data_inicio: string
  data_fim: string
  progresso: number
  status: string
  responsavel: string | null
  notas: string | null
  ordem: number
  created_at: string
  updated_at: string
}

export interface PepCronogramaFinanceiro {
  id: string
  pep_entry_id: string
  periodo: string
  valor_planejado: number
  valor_realizado: number
  moeda: string
  created_at: string
}

export const FASE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planejamento: { label: 'Planejamento', color: 'hsl(217, 91%, 60%)', bg: 'bg-blue-500' },
  licitacao:    { label: 'Licitação',    color: 'hsl(45, 93%, 47%)',  bg: 'bg-yellow-500' },
  contratacao:  { label: 'Contratação',  color: 'hsl(24, 95%, 53%)', bg: 'bg-orange-500' },
  execucao:     { label: 'Execução',     color: 'hsl(142, 71%, 45%)', bg: 'bg-green-500' },
  entrega:      { label: 'Entrega',      color: 'hsl(271, 91%, 65%)', bg: 'bg-purple-500' },
}

export const STATUS_TAREFA: Record<string, { label: string; color: string }> = {
  pendente:     { label: 'Pendente',      color: 'bg-muted text-muted-foreground' },
  em_andamento: { label: 'Em Andamento',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  concluida:    { label: 'Concluída',     color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  atrasada:     { label: 'Atrasada',      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

// ─── Tarefas ──────────────────────────────────────────────────────────────────
export const usePepTarefas = (entryId: string | undefined) =>
  useQuery<PepTarefa[]>({
    queryKey: ['pep_tarefas', entryId],
    queryFn: async () => {
      if (!entryId) return []
      const { data, error } = await supabase
        .from('pep_tarefas')
        .select('*')
        .eq('pep_entry_id', entryId)
        .order('ordem', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!entryId,
  })

export const useCreatePepTarefa = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<PepTarefa, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('pep_tarefas').insert(payload as any)
      if (error) throw error
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['pep_tarefas', v.pep_entry_id] }),
  })
}

export const useUpdatePepTarefa = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pep_entry_id, ...updates }: { id: string; pep_entry_id: string } & Partial<PepTarefa>) => {
      const { error } = await supabase.from('pep_tarefas').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id)
      if (error) throw error
      return pep_entry_id
    },
    onSuccess: (eid) => qc.invalidateQueries({ queryKey: ['pep_tarefas', eid] }),
  })
}

export const useDeletePepTarefa = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pep_entry_id }: { id: string; pep_entry_id: string }) => {
      const { error } = await supabase.from('pep_tarefas').delete().eq('id', id)
      if (error) throw error
      return pep_entry_id
    },
    onSuccess: (eid) => qc.invalidateQueries({ queryKey: ['pep_tarefas', eid] }),
  })
}

// ─── Cronograma Financeiro ────────────────────────────────────────────────────
export const usePepCronogramaFinanceiro = (entryId: string | undefined) =>
  useQuery<PepCronogramaFinanceiro[]>({
    queryKey: ['pep_cronograma_fin', entryId],
    queryFn: async () => {
      if (!entryId) return []
      const { data, error } = await supabase
        .from('pep_cronograma_financeiro')
        .select('*')
        .eq('pep_entry_id', entryId)
        .order('periodo', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!entryId,
  })
