import { supabase, type SyncLog } from '@/lib/supabase'
import { useRealtimeQuery } from './useRealtimeQuery'

export const useSyncLog = (limit = 10) =>
  useRealtimeQuery<SyncLog[]>({
    queryKey: ['sync_log', String(limit)],
    table: 'sync_log',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_log')
        .select('*')
        .order('executado_em', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
  })

export const useUltimaSyncLog = () =>
  useRealtimeQuery<SyncLog | null>({
    queryKey: ['sync_log_ultima'],
    table: 'sync_log',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_log')
        .select('*')
        .order('executado_em', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
