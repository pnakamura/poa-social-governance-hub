import { useEffect } from 'react'
import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UseRealtimeQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: string[]
  queryFn: () => Promise<T>
  table: string
  filter?: string
}

/**
 * Hook genérico que combina fetch inicial via React Query com
 * invalidação automática via Supabase Realtime (postgres_changes).
 * Quando qualquer INSERT/UPDATE/DELETE ocorrer na tabela, o cache
 * é invalidado e o fetch é refeito automaticamente.
 */
export function useRealtimeQuery<T>({
  queryKey,
  queryFn,
  table,
  filter,
  ...options
}: UseRealtimeQueryOptions<T>) {
  const queryClient = useQueryClient()
  const query = useQuery<T>({ queryKey, queryFn, ...options })

  useEffect(() => {
    const channelName = `rt-${table}-${queryKey.join('-')}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        () => { queryClient.invalidateQueries({ queryKey }) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, queryKey.join(',')])

  return query
}
