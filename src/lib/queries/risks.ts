import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Risco } from '../supabase'

export const useRiscos = () =>
  useQuery<Risco[]>({
    queryKey: ['riscos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riscos')
        .select('*')
        .order('nivel', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

export const useRiscoKPIs = () =>
  useQuery({
    queryKey: ['risco_kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riscos')
        .select('nivel,status,categoria')
        .eq('status', 'Ativo')
      if (error) throw error
      const rows = data ?? []
      return {
        total: rows.length,
        criticos: rows.filter((r) => r.nivel >= 16).length,
        altos: rows.filter((r) => r.nivel >= 10 && r.nivel < 16).length,
        medios: rows.filter((r) => r.nivel >= 5 && r.nivel < 10).length,
        baixos: rows.filter((r) => r.nivel < 5).length,
      }
    },
  })

export const useCreateRisco = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (risco: Omit<Risco, 'id' | 'nivel' | 'criado_em' | 'atualizado_em'>) => {
      const nivel = (risco.probabilidade ?? 0) * (risco.impacto ?? 0)
      const { data, error } = await supabase.from('riscos').insert({ ...risco, nivel }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['riscos'] }),
  })
}

export const useUpdateRisco = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Risco> & { id: string }) => {
      const nivel = (updates.probabilidade && updates.impacto)
        ? updates.probabilidade * updates.impacto
        : undefined
      const { data, error } = await supabase
        .from('riscos')
        .update({ ...updates, ...(nivel !== undefined && { nivel }), atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['riscos'] }),
  })
}

export const useDeleteRisco = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('riscos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['riscos'] }),
  })
}
