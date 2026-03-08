import { useQuery } from '@tanstack/react-query'
import { supabase, type PepEntry } from '../supabase'

export const usePEPEntries = (versao = 'v2') =>
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

/** KPIs financeiros do PEP — agrega linhas de Componente (ref='C') */
export const usePEPKPIs = (versao = 'v2') =>
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
      // N=BID atual, O=Local atual (contrapartida), P=Total atual
      // R=BID arranque, S=Local arranque, T=Total arranque
      const totN = rows.reduce((s, r) => s + (r.n_atual ?? 0), 0)
      const totO = rows.reduce((s, r) => s + (r.o_atual ?? 0), 0)
      const totP = rows.reduce((s, r) => s + (r.p_atual ?? 0), 0)
      const totR = rows.reduce((s, r) => s + (r.r_base ?? 0), 0)
      const totT = rows.reduce((s, r) => s + (r.t_base ?? 0), 0)
      return {
        totalBID:   totN,
        totalLocal: totO,
        totalAtual: totP,
        totalBase:  totT,
        deltaP:     totP - totT,
        deltaPct:   totT > 0 ? ((totP - totT) / totT) * 100 : 0,
        execucaoBID: totR > 0 ? (totN / totR) * 100 : 0,
      }
    },
  })

/** Dados do gráfico de barras: BID vs Local por Componente */
export const usePEPChartData = (versao = 'v2') =>
  useQuery({
    queryKey: ['pep_chart', versao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pep_entries')
        .select('descricao,n_atual,o_atual,r_base,s_base')
        .eq('versao', versao)
        .eq('ref', 'C')
        .order('comp', { nullsFirst: true })
      if (error) throw error
      return (data ?? []).map((r) => ({
        // Encurtar labels longos para o gráfico
        name: (r.descricao ?? '').replace(/^C\d+\s*[-–]\s*/i, '').substring(0, 22),
        bid:        r.n_atual ?? 0,
        local:      r.o_atual ?? 0,   // contrapartida municipal
        bid_base:   r.r_base  ?? 0,
        local_base: r.s_base  ?? 0,
      }))
    },
  })
