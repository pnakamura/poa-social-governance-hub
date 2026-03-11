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

export const useRiscosByTipo = (tipo: Risco['tipo']) =>
  useQuery<Risco[]>({
    queryKey: ['riscos', tipo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riscos')
        .select('*')
        .eq('tipo', tipo)
        .order('nivel', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

export type PepRiscoWithWbs = {
  id: string
  titulo_risco: string
  probabilidade: string
  impacto: string
  status: string
  mitigacao: string | null
  pep_entry_id: string
  codigo_wbs: string | null
  descricao_pep: string | null
}

const PROB_MAP: Record<string, number> = {
  'Muito Baixa': 1, 'Baixa': 2, 'Média': 3, 'Alta': 4, 'Muito Alta': 5,
}
const IMP_MAP: Record<string, number> = {
  'Muito Baixo': 1, 'Baixo': 2, 'Médio': 3, 'Alto': 4, 'Muito Alto': 5,
}

export const probToNum = (p: string) => PROB_MAP[p] ?? 3
export const impToNum = (i: string) => IMP_MAP[i] ?? 3

export const usePepRiscosAll = () =>
  useQuery<PepRiscoWithWbs[]>({
    queryKey: ['pep_riscos_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pep_riscos')
        .select('id, titulo_risco, probabilidade, impacto, status, mitigacao, pep_entry_id, pep_entries(codigo_wbs, descricao)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((r: any) => ({
        id: r.id,
        titulo_risco: r.titulo_risco,
        probabilidade: r.probabilidade,
        impacto: r.impacto,
        status: r.status,
        mitigacao: r.mitigacao,
        pep_entry_id: r.pep_entry_id,
        codigo_wbs: r.pep_entries?.codigo_wbs ?? null,
        descricao_pep: r.pep_entries?.descricao ?? null,
      }))
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
