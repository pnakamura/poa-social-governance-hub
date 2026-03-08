import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Atividade } from '../supabase'

export const useAtividades = () =>
  useQuery<Atividade[]>({
    queryKey: ['atividades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividades')
        .select('*')
        .order('prazo', { nullsFirst: false })
      if (error) throw error
      return data ?? []
    },
  })

export const useAtividadeKPIs = () =>
  useQuery({
    queryKey: ['atividade_kpis'],
    queryFn: async () => {
      const { data, error } = await supabase.from('atividades').select('status,prazo,progresso')
      if (error) throw error
      const rows = data ?? []
      const hoje = new Date().toISOString().split('T')[0]
      return {
        total: rows.length,
        emAndamento: rows.filter((r) => r.status === 'progress').length,
        concluidas: rows.filter((r) => r.status === 'done').length,
        emAtraso: rows.filter(
          (r) => r.prazo && r.prazo < hoje && r.status !== 'done'
        ).length,
        aguardando: rows.filter((r) => r.status === 'waiting').length,
      }
    },
  })

export const useUpdateAtividadeStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Atividade['status'] }) => {
      const { error } = await supabase
        .from('atividades')
        .update({ status, atualizado_em: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['atividades'] }),
  })
}

export const useCreateAtividade = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (atv: Omit<Atividade, 'id' | 'criado_em' | 'atualizado_em'>) => {
      const { data, error } = await supabase.from('atividades').insert(atv).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['atividades'] }),
  })
}

export const useDeleteAtividade = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('atividades').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['atividades'] }),
  })
}
