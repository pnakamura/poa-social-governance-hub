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

/** Dados de desembolso por componente (linhas ref='C') */
export const usePEPDesembolhos = (versao = 'v2') =>
  useQuery({
    queryKey: ['pep_desembolhos', versao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pep_entries')
        .select('comp,descricao,desembolso_2025,desembolso_2026,desembolso_2027,desembolso_2028,desembolso_2029,desembolso_total')
        .eq('versao', versao)
        .eq('ref', 'C')
        .order('comp', { nullsFirst: true })
      if (error) throw error
      return data ?? []
    },
  })

/** Cronograma físico — linhas PT com ao menos uma entrega prevista */
export const usePEPCronogramaFisico = (versao = 'v2') =>
  useQuery({
    queryKey: ['pep_cronograma', versao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pep_entries')
        .select('id,codigo_wbs,descricao,comp,prod,subp,pct,tipo_aquisicao,metodo_aquisicao,pmr_ref,fisica_2025,fisica_2026,fisica_2027,fisica_2028,fisica_2029,fisica_eop')
        .eq('versao', versao)
        .eq('ref', 'PT')
        .order('codigo_wbs', { nullsFirst: true })
      if (error) throw error
      // Filtrar apenas PT com ao menos uma entrega
      return (data ?? []).filter(r =>
        (r.fisica_2025 ?? 0) + (r.fisica_2026 ?? 0) + (r.fisica_2027 ?? 0) +
        (r.fisica_2028 ?? 0) + (r.fisica_2029 ?? 0) + (r.fisica_eop ?? 0) > 0
      )
    },
  })

/** Detalhes de uma entrada específica pelo código WBS */
export const usePEPEntryByWBS = (wbs: string, versao = 'v2') =>
  useQuery<import('../supabase').PepEntry | null>({
    queryKey: ['pep_entry_wbs', wbs, versao],
    queryFn: async () => {
      if (!wbs) return null
      const { data, error } = await supabase
        .from('pep_entries')
        .select('*')
        .eq('versao', versao)
        .eq('codigo_wbs', wbs)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!wbs,
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
