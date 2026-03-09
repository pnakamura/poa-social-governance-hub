import { useQuery } from '@tanstack/react-query'
import { supabase, type ProgramaContexto } from '../supabase'

export const useProgramaContexto = (categoria?: string) =>
  useQuery<ProgramaContexto[]>({
    queryKey: ['programa_contexto', categoria ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('programa_contexto').select('*').order('categoria')
      if (categoria) query = query.eq('categoria', categoria)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })

export const useProgramaContextoKPIs = () =>
  useQuery({
    queryKey: ['programa_contexto_kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programa_contexto')
        .select('categoria,indicador,valor,valor_texto,unidade')
      if (error) throw error
      const rows = data ?? []

      const find = (indicador: string) => rows.find((r) => r.indicador === indicador)

      return {
        populacao:         find('População total de Porto Alegre'),
        pobrezaExtrema:    find('Famílias em pobreza extrema'),
        moradoresRua:      find('Moradores de rua'),
        criancasFora:      find('Crianças e adolescentes fora da escola (7-17 anos)'),
        jovensNemNem:      find('Jovens nem-nem (não estudam, não trabalham)'),
        valorPrograma:     find('Valor total do programa (BID + Local)'),
        financiamentoBID:  find('Financiamento BID'),
        contrapartida:     find('Contrapartida local PMPA'),
        prazoExecucao:     find('Prazo de execução do programa'),
        rows,
      }
    },
  })
