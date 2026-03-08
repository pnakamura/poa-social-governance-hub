import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type NotaCritica, type Recomendacao, type NaoObjecao } from '../supabase'

// ─── Notas Críticas ────────────────────────────────────────────────────────

export const useNotasCriticas = () =>
  useQuery<NotaCritica[]>({
    queryKey: ['notas_criticas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notas_criticas')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

export const useCreateNota = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (nota: Omit<NotaCritica, 'id' | 'criado_em'>) => {
      const { data, error } = await supabase.from('notas_criticas').insert(nota).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notas_criticas'] }),
  })
}

// ─── Recomendações ─────────────────────────────────────────────────────────

export const useRecomendacoes = () =>
  useQuery<Recomendacao[]>({
    queryKey: ['recomendacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recomendacoes')
        .select('*')
        .order('urgencia,criado_em')
      if (error) throw error
      return data ?? []
    },
  })

export const useCreateRecomendacao = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rec: Omit<Recomendacao, 'id' | 'criado_em'>) => {
      const { data, error } = await supabase.from('recomendacoes').insert(rec).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recomendacoes'] }),
  })
}

// ─── Não-Objeções ──────────────────────────────────────────────────────────

export const useNaoObjecoes = () =>
  useQuery<NaoObjecao[]>({
    queryKey: ['nao_objecoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nao_objecoes')
        .select('*')
        .order('solicitado_em', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

export const useNaoObjecaoKPIs = () =>
  useQuery({
    queryKey: ['nao_objecao_kpis'],
    queryFn: async () => {
      const { data, error } = await supabase.from('nao_objecoes').select('status,valor_usd')
      if (error) throw error
      const rows = data ?? []
      return {
        total: rows.length,
        pendentes: rows.filter((r) => r.status === 'Pendente').length,
        recebidas: rows.filter((r) => r.status === 'Recebida').length,
        vencidas: rows.filter((r) => r.status === 'Vencida').length,
      }
    },
  })

export const useCreateNaoObjecao = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (no: Omit<NaoObjecao, 'id' | 'criado_em'>) => {
      const { data, error } = await supabase.from('nao_objecoes').insert(no).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nao_objecoes'] }),
  })
}
