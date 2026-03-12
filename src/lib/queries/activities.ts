import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Atividade, type AtividadeComentario, type AtividadeAlerta, type AtividadeChecklist } from '../supabase'

// ─── Atividades ─────────────────────────────────────────────────────────────

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

export const useUpdateAtividade = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Atividade> & { id: string }) => {
      const { error } = await supabase
        .from('atividades')
        .update({ ...fields, atualizado_em: new Date().toISOString() })
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

// ─── Comentários ────────────────────────────────────────────────────────────

export const useComentarios = (atividadeId: string | null) =>
  useQuery<AtividadeComentario[]>({
    queryKey: ['atividade_comentarios', atividadeId],
    enabled: !!atividadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividade_comentarios')
        .select('*')
        .eq('atividade_id', atividadeId!)
        .order('criado_em', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

export const useCreateComentario = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: Omit<AtividadeComentario, 'id' | 'criado_em'>) => {
      const { error } = await supabase.from('atividade_comentarios').insert(c)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['atividade_comentarios', vars.atividade_id] })
      qc.invalidateQueries({ queryKey: ['atividade_counts'] })
    },
  })
}

// ─── Alertas ────────────────────────────────────────────────────────────────

export const useAlertas = (atividadeId: string | null) =>
  useQuery<AtividadeAlerta[]>({
    queryKey: ['atividade_alertas', atividadeId],
    enabled: !!atividadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividade_alertas')
        .select('*')
        .eq('atividade_id', atividadeId!)
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

export const useCreateAlerta = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (a: Omit<AtividadeAlerta, 'id' | 'criado_em'>) => {
      const { error } = await supabase.from('atividade_alertas').insert(a)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['atividade_alertas', vars.atividade_id] })
      qc.invalidateQueries({ queryKey: ['atividade_counts'] })
    },
  })
}

export const useToggleAlertaResolvido = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, resolvido, atividade_id }: { id: string; resolvido: boolean; atividade_id: string }) => {
      const { error } = await supabase.from('atividade_alertas').update({ resolvido }).eq('id', id)
      if (error) throw error
      return atividade_id
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['atividade_alertas', vars.atividade_id] })
      qc.invalidateQueries({ queryKey: ['atividade_counts'] })
    },
  })
}

// ─── Counts for badges ─────────────────────────────────────────────────────

export const useAtividadeCounts = () =>
  useQuery({
    queryKey: ['atividade_counts'],
    queryFn: async () => {
      const [comentarios, alertas] = await Promise.all([
        supabase.from('atividade_comentarios').select('atividade_id'),
        supabase.from('atividade_alertas').select('atividade_id,resolvido'),
      ])
      const commentMap: Record<string, number> = {}
      for (const c of comentarios.data ?? []) {
        commentMap[c.atividade_id] = (commentMap[c.atividade_id] || 0) + 1
      }
      const alertMap: Record<string, number> = {}
      for (const a of alertas.data ?? []) {
        if (!(a as any).resolvido) {
          alertMap[a.atividade_id] = (alertMap[a.atividade_id] || 0) + 1
        }
      }
      return { commentMap, alertMap }
    },
  })
