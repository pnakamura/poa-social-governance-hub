import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PepGestao {
  id: string
  pep_entry_id: string
  status: string
  progresso: number
  data_inicio_real: string | null
  data_fim_previsto: string | null
  nivel_risco: string
  notas: string | null
  created_at: string
  updated_at: string
}

export interface PepImpedimento {
  id: string
  pep_entry_id: string
  descricao: string
  resolvido: boolean
  created_at: string
}

export interface PepRisco {
  id: string
  pep_entry_id: string
  risco_global_id: string | null
  titulo_risco: string
  probabilidade: string
  impacto: string
  mitigacao: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface PepHistorico {
  id: string
  pep_entry_id: string
  campo: string
  valor_anterior: string | null
  valor_novo: string | null
  usuario: string
  created_at: string
}

export interface StorageFile {
  name: string
  id: string | null
  metadata: { mimetype?: string; size?: number } | null
  created_at: string | null
}

// ─── Gestão ───────────────────────────────────────────────────────────────────
export const usePepGestao = (entryId: string | undefined) =>
  useQuery<PepGestao | null>({
    queryKey: ['pep_gestao', entryId],
    queryFn: async () => {
      if (!entryId) return null
      const { data, error } = await supabase
        .from('pep_gestao')
        .select('*')
        .eq('pep_entry_id', entryId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!entryId,
  })

export const useUpsertPepGestao = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<PepGestao> & { pep_entry_id: string }) => {
      const { data, error } = await supabase
        .from('pep_gestao')
        .upsert(payload, { onConflict: 'pep_entry_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['pep_gestao', data.pep_entry_id] })
    },
  })
}

// ─── Histórico helper (log changes) ──────────────────────────────────────────
async function logChange(pep_entry_id: string, campo: string, valor_anterior: string | null, valor_novo: string | null) {
  await supabase.from('pep_historico').insert({ pep_entry_id, campo, valor_anterior, valor_novo })
}

export { logChange }

// ─── Impedimentos ─────────────────────────────────────────────────────────────
export const usePepImpedimentos = (entryId: string | undefined) =>
  useQuery<PepImpedimento[]>({
    queryKey: ['pep_impedimentos', entryId],
    queryFn: async () => {
      if (!entryId) return []
      const { data, error } = await supabase
        .from('pep_impedimentos')
        .select('*')
        .eq('pep_entry_id', entryId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!entryId,
  })

export const useAddImpedimento = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { pep_entry_id: string; descricao: string }) => {
      const { error } = await supabase.from('pep_impedimentos').insert(payload)
      if (error) throw error
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['pep_impedimentos', v.pep_entry_id] }),
  })
}

export const useToggleImpedimento = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, resolvido, pep_entry_id }: { id: string; resolvido: boolean; pep_entry_id: string }) => {
      const { error } = await supabase.from('pep_impedimentos').update({ resolvido }).eq('id', id)
      if (error) throw error
      return pep_entry_id
    },
    onSuccess: (eid) => qc.invalidateQueries({ queryKey: ['pep_impedimentos', eid] }),
  })
}

export const useDeleteImpedimento = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pep_entry_id }: { id: string; pep_entry_id: string }) => {
      const { error } = await supabase.from('pep_impedimentos').delete().eq('id', id)
      if (error) throw error
      return pep_entry_id
    },
    onSuccess: (eid) => qc.invalidateQueries({ queryKey: ['pep_impedimentos', eid] }),
  })
}

// ─── Histórico ────────────────────────────────────────────────────────────────
export const usePepHistorico = (entryId: string | undefined) =>
  useQuery<PepHistorico[]>({
    queryKey: ['pep_historico', entryId],
    queryFn: async () => {
      if (!entryId) return []
      const { data, error } = await supabase
        .from('pep_historico')
        .select('*')
        .eq('pep_entry_id', entryId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    },
    enabled: !!entryId,
  })

// ─── Evidências (Storage) ─────────────────────────────────────────────────────
const BUCKET = 'pep-evidencias'

export const usePepEvidencias = (wbs: string | undefined) =>
  useQuery<StorageFile[]>({
    queryKey: ['pep_evidencias', wbs],
    queryFn: async () => {
      if (!wbs) return []
      const { data, error } = await supabase.storage.from(BUCKET).list(wbs)
      if (error) throw error
      return (data ?? []) as StorageFile[]
    },
    enabled: !!wbs,
  })

export const useUploadEvidencia = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ wbs, file }: { wbs: string; file: File }) => {
      const path = `${wbs}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file)
      if (error) throw error
      return wbs
    },
    onSuccess: (wbs) => qc.invalidateQueries({ queryKey: ['pep_evidencias', wbs] }),
  })
}

export const useDeleteEvidencia = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ wbs, fileName }: { wbs: string; fileName: string }) => {
      const { error } = await supabase.storage.from(BUCKET).remove([`${wbs}/${fileName}`])
      if (error) throw error
      return wbs
    },
    onSuccess: (wbs) => qc.invalidateQueries({ queryKey: ['pep_evidencias', wbs] }),
  })
}

export const getEvidenciaUrl = (wbs: string, fileName: string) => {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${wbs}/${fileName}`)
  return data.publicUrl
}

// ─── Riscos do Item PEP ───────────────────────────────────────────────────────
export const usePepRiscos = (entryId: string | undefined) =>
  useQuery<PepRisco[]>({
    queryKey: ['pep_riscos', entryId],
    queryFn: async () => {
      if (!entryId) return []
      const { data, error } = await supabase
        .from('pep_riscos')
        .select('*')
        .eq('pep_entry_id', entryId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as PepRisco[]
    },
    enabled: !!entryId,
  })

export const useAddPepRisco = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { pep_entry_id: string; titulo_risco: string; probabilidade: string; impacto: string; mitigacao?: string; risco_global_id?: string }) => {
      const { error } = await supabase.from('pep_riscos').insert(payload as any)
      if (error) throw error
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['pep_riscos', v.pep_entry_id] }),
  })
}

export const useUpdatePepRisco = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pep_entry_id, ...updates }: { id: string; pep_entry_id: string } & Partial<PepRisco>) => {
      const { error } = await supabase.from('pep_riscos').update(updates as any).eq('id', id)
      if (error) throw error
      return pep_entry_id
    },
    onSuccess: (eid) => qc.invalidateQueries({ queryKey: ['pep_riscos', eid] }),
  })
}

export const useDeletePepRisco = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pep_entry_id }: { id: string; pep_entry_id: string }) => {
      const { error } = await supabase.from('pep_riscos').delete().eq('id', id)
      if (error) throw error
      return pep_entry_id
    },
    onSuccess: (eid) => qc.invalidateQueries({ queryKey: ['pep_riscos', eid] }),
  })
}
