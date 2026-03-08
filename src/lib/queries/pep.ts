import { useQuery } from '@tanstack/react-query'
import { supabase, type PepEntry } from '../supabase'

export const usePEPEntries = (versao = 'v1') =>
  useQuery<PepEntry[]>({
    queryKey: ['pep', versao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pep_entries')
        .select('*')
        .eq('versao', versao)
        .order('comp', { nullsFirst: true })
      if (error) throw error
      return data ?? []
    },
  })

export const usePEPVersoes = () =>
  useQuery<string[]>({
    queryKey: ['pep_versoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pep_entries')
        .select('versao')
        .order('versao')
      if (error) throw error
      return [...new Set((data ?? []).map((r) => r.versao))]
    },
  })

/** KPIs financeiros do PEP */
export const usePEPKPIs = (versao = 'v1') =>
  useQuery({
    queryKey: ['pep_kpis', versao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pep_entries')
        .select('ref,n_atual,o_atual,p_atual,r_base,s_base,t_base')
        .eq('versao', versao)
        .eq('ref', 'C')
      if (error) throw error
      const rows = data ?? []
      const totN = rows.reduce((s, r) => s + (r.n_atual ?? 0), 0)
      const totO = rows.reduce((s, r) => s + (r.o_atual ?? 0), 0)
      const totP = rows.reduce((s, r) => s + (r.p_atual ?? 0), 0)
      const totR = rows.reduce((s, r) => s + (r.r_base ?? 0), 0)
      const totT = rows.reduce((s, r) => s + (r.t_base ?? 0), 0)
      return {
        totalBID: totN,
        totalLocal: totO,
        totalAtual: totP,
        totalBase: totT,
        deltaP: totP - totT,
        deltaPct: totT > 0 ? ((totP - totT) / totT) * 100 : 0,
        execucaoBID: totR > 0 ? (totN / totR) * 100 : 0,
      }
    },
  })
