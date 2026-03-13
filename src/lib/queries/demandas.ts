import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Demanda, type InboxCaptura, type DemandaHistorico } from '../supabase'

const PARSE_INBOX_URL =
  (import.meta.env.VITE_SUPABASE_URL as string || 'https://dvqnlnxkwcrxbctujajl.supabase.co') +
  '/functions/v1/parse-inbox'

// ── Queries ───────────────────────────────────────────────────────────────────

export interface DemandaFiltros {
  status?: string
  tipo?: string
  prioridade?: string
  projeto?: string
  responsavel?: string
  busca?: string
}

export const useDemandas = (filtros?: DemandaFiltros) =>
  useQuery<Demanda[]>({
    queryKey: ['demandas', filtros],
    queryFn: async () => {
      let q = supabase
        .from('demandas')
        .select('*')
        .order('prazo', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (filtros?.status)     q = q.eq('status', filtros.status)
      if (filtros?.tipo)       q = q.eq('tipo', filtros.tipo)
      if (filtros?.prioridade) q = q.eq('prioridade', filtros.prioridade)
      if (filtros?.projeto)    q = q.eq('projeto', filtros.projeto)
      if (filtros?.responsavel) q = q.ilike('responsavel', `%${filtros.responsavel}%`)
      if (filtros?.busca)      q = q.or(`titulo.ilike.%${filtros.busca}%,descricao.ilike.%${filtros.busca}%`)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })

export const useDemandasAbertas = () =>
  useQuery<Demanda[]>({
    queryKey: ['demandas', 'abertas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandas')
        .select('*')
        .in('status', ['aberta', 'em_andamento', 'aguardando'])
        .order('prazo', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data ?? []
    },
  })

export const useDemandasByCaptura = (capturaId: string | null) =>
  useQuery<Demanda[]>({
    queryKey: ['demandas', 'captura', capturaId],
    queryFn: async () => {
      if (!capturaId) return []
      const { data, error } = await supabase
        .from('demandas')
        .select('*')
        .eq('inbox_captura_id', capturaId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!capturaId,
  })

export const useInboxCapturas = () =>
  useQuery<InboxCaptura[]>({
    queryKey: ['inbox_capturas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbox_capturas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    },
  })

export const useDemandaHistorico = (demandaId: string | null) =>
  useQuery<DemandaHistorico[]>({
    queryKey: ['demandas_historico', demandaId],
    queryFn: async () => {
      if (!demandaId) return []
      const { data, error } = await supabase
        .from('demandas_historico')
        .select('*')
        .eq('demanda_id', demandaId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!demandaId,
  })

// ── Mutations ─────────────────────────────────────────────────────────────────

export const useCreateDemanda = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (demanda: Partial<Demanda>) => {
      const { data, error } = await supabase
        .from('demandas')
        .insert({ ...demanda, extraido_por_ia: false })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['demandas'] })
    },
  })
}

export const useUpdateDemandaStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      valorAnterior,
    }: {
      id: string
      status: Demanda['status']
      valorAnterior: string
    }) => {
      // Atualiza status
      const { error } = await supabase
        .from('demandas')
        .update({ status })
        .eq('id', id)
      if (error) throw error

      // Grava histórico
      await supabase.from('demandas_historico').insert({
        demanda_id: id,
        campo: 'status',
        valor_anterior: valorAnterior,
        valor_novo: status,
        usuario: 'usuario',
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['demandas'] })
    },
  })
}

export const useUpdateDemanda = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      changes,
      historico,
    }: {
      id: string
      changes: Partial<Demanda>
      historico?: { campo: string; anterior: string; novo: string }[]
    }) => {
      const { error } = await supabase
        .from('demandas')
        .update(changes)
        .eq('id', id)
      if (error) throw error

      if (historico && historico.length > 0) {
        await supabase.from('demandas_historico').insert(
          historico.map((h) => ({
            demanda_id: id,
            campo: h.campo,
            valor_anterior: h.anterior,
            valor_novo: h.novo,
            usuario: 'usuario',
          }))
        )
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['demandas'] })
      qc.invalidateQueries({ queryKey: ['demandas_historico'] })
    },
  })
}

export const useCancelarDemanda = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, statusAnterior }: { id: string; statusAnterior: string }) => {
      const { error } = await supabase
        .from('demandas')
        .update({ status: 'cancelada' })
        .eq('id', id)
      if (error) throw error

      await supabase.from('demandas_historico').insert({
        demanda_id: id,
        campo: 'status',
        valor_anterior: statusAnterior,
        valor_novo: 'cancelada',
        usuario: 'usuario',
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['demandas'] })
    },
  })
}

// ── Edge Function: parse-inbox ─────────────────────────────────────────────────

export interface ParseInboxPayload {
  texto: string
  tipo_fonte: InboxCaptura['tipo_fonte']
  titulo?: string
  autor_fonte?: string
  data_fonte?: string
  salvar?: boolean
  projeto?: string
}

export interface ParseInboxResult {
  captura_id: string | null
  demandas_extraidas: Partial<Demanda>[]
  total: number
  salvo: boolean
  demandas_salvas?: number
}

export const parseInbox = async (payload: ParseInboxPayload): Promise<ParseInboxResult> => {
  const res = await fetch(PARSE_INBOX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`parse-inbox error ${res.status}: ${err}`)
  }

  return res.json()
}
