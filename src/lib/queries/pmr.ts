import { useQuery } from '@tanstack/react-query'
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
