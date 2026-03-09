import { supabase, type TemaMonitoramento, type Risco, type Atividade, type PontoAtencao, type Aquisicao, type Marco } from '@/lib/supabase'
import { useRealtimeQuery } from './useRealtimeQuery'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ─── Lista de temas ────────────────────────────────────────────────────────────
export const useTemas = () =>
  useRealtimeQuery<TemaMonitoramento[]>({
    queryKey: ['temas_monitoramento'],
    table: 'temas_monitoramento',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temas_monitoramento')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

// ─── Adicionar tema ────────────────────────────────────────────────────────────
export const useAddTema = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ nome, descricao, palavrasChave }: { nome: string; descricao?: string; palavrasChave: string[] }) => {
      const { error } = await supabase.from('temas_monitoramento').insert({
        nome,
        descricao: descricao ?? null,
        palavras_chave: palavrasChave,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['temas_monitoramento'] }),
  })
}

// ─── Remover tema ──────────────────────────────────────────────────────────────
export const useRemoveTema = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('temas_monitoramento').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['temas_monitoramento'] }),
  })
}

// ─── Tipos de resultado de matches ────────────────────────────────────────────
export type TemaMatches = {
  riscos: Risco[]
  atividades: Atividade[]
  pontosAtencao: PontoAtencao[]
  aquisicoes: Aquisicao[]
  marcos: Marco[]
  total: number
}

// ─── Busca transversal por palavras-chave ─────────────────────────────────────
export const useTemaMatches = (palavrasChave: string[]) => {
  return useQuery<TemaMatches>({
    queryKey: ['tema_matches', ...palavrasChave],
    enabled: palavrasChave.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const orFilter = (campos: string[]) =>
        palavrasChave.flatMap(k => campos.map(c => `${c}.ilike.%${k}%`)).join(',')

      const [riscos, atividades, pontosAtencao, aquisicoes, marcos] = await Promise.all([
        supabase.from('riscos').select('*').or(orFilter(['descricao', 'categoria', 'mitigacao'])).limit(20),
        supabase.from('atividades').select('*').or(orFilter(['titulo', 'descricao', 'responsavel'])).limit(20),
        supabase.from('pontos_atencao').select('*').or(orFilter(['tema', 'descricao', 'area'])).limit(20),
        supabase.from('aquisicoes').select('*').or(orFilter(['titulo', 'secretaria', 'componente'])).limit(20),
        supabase.from('marcos').select('*').or(orFilter(['titulo', 'descricao', 'area'])).limit(20),
      ])

      const r = riscos.data ?? []
      const a = atividades.data ?? []
      const p = pontosAtencao.data ?? []
      const aq = aquisicoes.data ?? []
      const m = marcos.data ?? []

      return {
        riscos: r,
        atividades: a,
        pontosAtencao: p,
        aquisicoes: aq,
        marcos: m,
        total: r.length + a.length + p.length + aq.length + m.length,
      }
    },
  })
}
