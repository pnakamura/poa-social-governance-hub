import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type PmrOutput, type PmrOutcome } from '../supabase'

export const usePMROutputs = () =>
  useQuery<PmrOutput[]>({
    queryKey: ['pmr_outputs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pmr_outputs')
        .select('*')
        .order('componente,codigo')
      if (error) throw error
      return data ?? []
    },
  })

export const usePMROutcomes = () =>
  useQuery<PmrOutcome[]>({
    queryKey: ['pmr_outcomes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pmr_outcomes')
        .select('*')
        .order('componente,codigo')
      if (error) throw error
      return data ?? []
    },
  })

export const usePMRKPIs = () =>
  useQuery({
    queryKey: ['pmr_kpis'],
    queryFn: async () => {
      const [{ data: outputs }, { data: outcomes }] = await Promise.all([
        supabase.from('pmr_outputs').select('pct_realizado'),
        supabase.from('pmr_outcomes').select('pct_realizado'),
      ])
      const avgOutput =
        outputs && outputs.length > 0
          ? outputs.reduce((s, r) => s + (r.pct_realizado ?? 0), 0) / outputs.length
          : 0
      const avgOutcome =
        outcomes && outcomes.length > 0
          ? outcomes.reduce((s, r) => s + (r.pct_realizado ?? 0), 0) / outcomes.length
          : 0
      return {
        execucaoFisica: avgOutput,
        execucaoResultados: avgOutcome,
        totalOutputs: outputs?.length ?? 0,
        totalOutcomes: outcomes?.length ?? 0,
      }
    },
  })

// ── Mutations ──────────────────────────────────────────────────────────────

export const useUpdatePMROutput = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, realizado, meta_contrato }: { id: string; realizado: number; meta_contrato: number | null }) => {
      const pct_realizado = meta_contrato && meta_contrato > 0
        ? (realizado / meta_contrato) * 100
        : 0
      const { error } = await supabase
        .from('pmr_outputs')
        .update({ realizado, pct_realizado })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pmr_outputs'] })
      qc.invalidateQueries({ queryKey: ['pmr_kpis'] })
    },
  })
}

export const useUpdatePMROutcome = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, realizado, meta_contrato }: { id: string; realizado: number; meta_contrato: number | null }) => {
      const pct_realizado = meta_contrato && meta_contrato > 0
        ? (realizado / meta_contrato) * 100
        : 0
      const { error } = await supabase
        .from('pmr_outcomes')
        .update({ realizado, pct_realizado })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pmr_outcomes'] })
      qc.invalidateQueries({ queryKey: ['pmr_kpis'] })
    },
  })
}
