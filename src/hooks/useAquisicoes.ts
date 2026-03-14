import { supabase, type Aquisicao } from '@/lib/supabase'
import { useRealtimeQuery } from './useRealtimeQuery'

export const useAquisicoes = (filtros?: { secretaria?: string; tipo?: string; status?: string }) =>
  useRealtimeQuery<Aquisicao[]>({
    queryKey: ['aquisicoes', filtros?.secretaria ?? '', filtros?.tipo ?? '', filtros?.status ?? ''],
    table: 'aquisicoes',
    queryFn: async () => {
      let q = supabase
        .from('aquisicoes')
        .select('*')
        .order('data_inicio_previsto', { ascending: true, nullsFirst: false })
      if (filtros?.secretaria) q = q.eq('secretaria', filtros.secretaria)
      if (filtros?.tipo) q = q.eq('tipo', filtros.tipo)
      if (filtros?.status) q = q.eq('status', filtros.status)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as Aquisicao[]
    },
  })
