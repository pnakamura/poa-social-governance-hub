import { supabase, type Marco } from '@/lib/supabase'
import { useRealtimeQuery } from './useRealtimeQuery'

export const useMarcos = (filtros?: { area?: string; tipo?: string; status?: string }) =>
  useRealtimeQuery<Marco[]>({
    queryKey: ['marcos', filtros?.area ?? '', filtros?.tipo ?? '', filtros?.status ?? ''],
    table: 'marcos',
    queryFn: async () => {
      let q = supabase.from('marcos').select('*').order('data_marco', { ascending: true })
      if (filtros?.area) q = q.eq('area', filtros.area)
      if (filtros?.tipo) q = q.eq('tipo', filtros.tipo)
      if (filtros?.status) q = q.eq('status', filtros.status)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
