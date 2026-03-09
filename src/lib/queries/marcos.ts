import { useQuery } from '@tanstack/react-query'
import { supabase, type Marco } from '../supabase'

export const useMarcos = (status?: string) =>
  useQuery<Marco[]>({
    queryKey: ['marcos', status ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('marcos').select('*').order('data_marco', { ascending: false })
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })

export const useProximosMarcos = (limit = 3) =>
  useQuery<Marco[]>({
    queryKey: ['marcos_proximos', limit],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('marcos')
        .select('*')
        .gte('data_marco', hoje)
        .in('status', ['previsto', 'em_andamento'])
        .order('data_marco', { ascending: true })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
  })

export const useMarcoKPIs = () =>
  useQuery({
    queryKey: ['marcos_kpis'],
    queryFn: async () => {
      const { data, error } = await supabase.from('marcos').select('status,tipo,area')
      if (error) throw error
      const rows = data ?? []
      return {
        total:       rows.length,
        concluidos:  rows.filter((m) => m.status === 'concluido').length,
        emAndamento: rows.filter((m) => m.status === 'em_andamento').length,
        previstos:   rows.filter((m) => m.status === 'previsto').length,
        atrasados:   rows.filter((m) => m.status === 'atrasado').length,
      }
    },
  })
