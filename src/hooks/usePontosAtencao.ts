import { supabase, type PontoAtencao } from '@/lib/supabase'
import { useRealtimeQuery } from './useRealtimeQuery'

export const usePontosAtencao = (apenasAtivos = true) =>
  useRealtimeQuery<PontoAtencao[]>({
    queryKey: ['pontos_atencao', String(apenasAtivos)],
    table: 'pontos_atencao',
    queryFn: async () => {
      let q = supabase
        .from('pontos_atencao')
        .select('*')
        .order('criticidade', { ascending: true })
      if (apenasAtivos) q = q.eq('ativo', true)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as PontoAtencao[]
    },
  })
