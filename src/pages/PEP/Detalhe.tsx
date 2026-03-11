import { useState, useCallback, useRef, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, Download, Upload, Image as ImageIcon, FileText, Clock, AlertTriangle, ChevronRight, Camera, ShieldAlert, Link2 } from 'lucide-react'
import logoPoaSocial from '@/assets/logo-poa-social.png'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { usePEPEntries } from '@/lib/queries/pep'
import { type PepEntry, supabase } from '@/lib/supabase'
import {
  usePepGestao, useUpsertPepGestao, logChange,
  usePepImpedimentos, useAddImpedimento, useToggleImpedimento, useDeleteImpedimento,
  usePepHistorico,
  usePepEvidencias, useUploadEvidencia, useDeleteEvidencia, getEvidenciaUrl,
  usePepRiscos, useAddPepRisco, useUpdatePepRisco, useDeletePepRisco,
  type PepRisco,
} from '@/lib/queries/pep-gestao'

// ─── Formatadores ─────────────────────────────────────────────────────────────
const fUSD = (v: number | null | undefined) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—'
const fBRL = (v: number | null | undefined) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) : '—'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  nao_iniciado: { label: 'Não Iniciado', color: 'bg-muted text-muted-foreground' },
  em_execucao:  { label: 'Em Execução',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  concluido:    { label: 'Concluído',    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  atrasado:     { label: 'Atrasado',     color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

const RISCO_MAP: Record<string, { label: string; color: string }> = {
  baixo: { label: 'Baixo', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  medio: { label: 'Médio', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  alto:  { label: 'Alto',  color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

const REF_LABELS: Record<string, string> = {
  C: 'Componente', SC: 'Subcomponente', P: 'Produto', SP: 'Subproduto', PT: 'Pacote de Trabalho',
}

const ANOS_FIN = ['2025', '2026', '2027', '2028', '2029'] as const

function isImageFile(name: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PEPDetalhePage() {
  const { wbs } = useParams<{ wbs: string }>()
  const decodedWbs = wbs ? decodeURIComponent(wbs) : ''
  const navigate = useNavigate()

  const { data: allEntries = [], isLoading: loadingEntries } = usePEPEntries('v2')
  const entry = useMemo(() => allEntries.find(e => e.codigo_wbs === decodedWbs) ?? null, [allEntries, decodedWbs])

  const children = useMemo(() => {
    if (!entry) return []
    const { comp, prod, subp, ref } = entry
    return allEntries.filter(e => {
      if (e.id === entry.id) return false
      if (ref === 'C') return e.comp === comp && e.ref !== 'C'
      if (ref === 'P') return e.comp === comp && e.prod === prod && (e.ref === 'SP' || e.ref === 'PT')
      if (ref === 'SP') return e.comp === comp && e.prod === prod && e.subp === subp && e.ref === 'PT'
      return false
    })
  }, [entry, allEntries])

  const { data: gestao, isLoading: loadingGestao } = usePepGestao(entry?.id)
  const upsertGestao = useUpsertPepGestao()
  const { data: impedimentos = [] } = usePepImpedimentos(entry?.id)
  const addImpedimento = useAddImpedimento()
  const toggleImpedimento = useToggleImpedimento()
  const deleteImpedimento = useDeleteImpedimento()
  const { data: historico = [] } = usePepHistorico(entry?.id)
  const { data: evidencias = [] } = usePepEvidencias(decodedWbs)
  const uploadEvidencia = useUploadEvidencia()
  const deleteEvidencia = useDeleteEvidencia()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    status: 'nao_iniciado', progresso: 0, data_inicio_real: '', data_fim_previsto: '',
    nivel_risco: 'baixo', notas: '', tipo_aquisicao: '', metodo_aquisicao: '',
  })

  const startEdit = useCallback(() => {
    setForm({
      status: gestao?.status ?? 'nao_iniciado', progresso: gestao?.progresso ?? 0,
      data_inicio_real: gestao?.data_inicio_real ?? '', data_fim_previsto: gestao?.data_fim_previsto ?? '',
      nivel_risco: gestao?.nivel_risco ?? 'baixo', notas: gestao?.notas ?? '',
      tipo_aquisicao: entry?.tipo_aquisicao ?? '', metodo_aquisicao: entry?.metodo_aquisicao ?? '',
    })
    setEditing(true)
  }, [gestao, entry])

  const handleSave = useCallback(async () => {
    if (!entry) return
    try {
      const old = gestao
      const changes: [string, string | null, string | null][] = []
      if ((old?.status ?? 'nao_iniciado') !== form.status) changes.push(['status', old?.status ?? 'nao_iniciado', form.status])
      if ((old?.progresso ?? 0) !== form.progresso) changes.push(['progresso', String(old?.progresso ?? 0), String(form.progresso)])
      if ((old?.data_inicio_real ?? '') !== form.data_inicio_real) changes.push(['data_inicio_real', old?.data_inicio_real ?? null, form.data_inicio_real || null])
      if ((old?.data_fim_previsto ?? '') !== form.data_fim_previsto) changes.push(['data_fim_previsto', old?.data_fim_previsto ?? null, form.data_fim_previsto || null])
      if ((old?.nivel_risco ?? 'baixo') !== form.nivel_risco) changes.push(['nivel_risco', old?.nivel_risco ?? 'baixo', form.nivel_risco])
      if ((old?.notas ?? '') !== (form.notas ?? '')) changes.push(['notas', old?.notas ?? null, form.notas || null])

      await upsertGestao.mutateAsync({
        pep_entry_id: entry.id, status: form.status, progresso: form.progresso,
        data_inicio_real: form.data_inicio_real || null, data_fim_previsto: form.data_fim_previsto || null,
        nivel_risco: form.nivel_risco, notas: form.notas || null,
      })

      if (form.tipo_aquisicao !== (entry.tipo_aquisicao ?? '') || form.metodo_aquisicao !== (entry.metodo_aquisicao ?? '')) {
        await supabase.from('pep_entries').update({
          tipo_aquisicao: form.tipo_aquisicao || null, metodo_aquisicao: form.metodo_aquisicao || null,
        }).eq('id', entry.id)
        if (form.tipo_aquisicao !== (entry.tipo_aquisicao ?? '')) changes.push(['tipo_aquisicao', entry.tipo_aquisicao ?? null, form.tipo_aquisicao || null])
        if (form.metodo_aquisicao !== (entry.metodo_aquisicao ?? '')) changes.push(['metodo_aquisicao', entry.metodo_aquisicao ?? null, form.metodo_aquisicao || null])
      }

      for (const [campo, anterior, novo] of changes) {
        await logChange(entry.id, campo, anterior, novo)
      }

      setEditing(false)
      toast.success('Dados salvos com sucesso')
    } catch {
      toast.error('Erro ao salvar')
    }
  }, [entry, gestao, form, upsertGestao])

  const [newImpedimento, setNewImpedimento] = useState('')
  const handleAddImpedimento = useCallback(async () => {
    if (!entry || !newImpedimento.trim()) return
    await addImpedimento.mutateAsync({ pep_entry_id: entry.id, descricao: newImpedimento.trim() })
    setNewImpedimento('')
  }, [entry, newImpedimento, addImpedimento])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || !decodedWbs) return
    for (const file of Array.from(files)) {
      try {
        await uploadEvidencia.mutateAsync({ wbs: decodedWbs, file })
        toast.success(`${file.name} enviado`)
      } catch { toast.error(`Erro ao enviar ${file.name}`) }
    }
  }, [decodedWbs, uploadEvidencia])

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [editingDescricao, setEditingDescricao] = useState(false)
  const [descricaoEdit, setDescricaoEdit] = useState('')

  const heroLoaded = useRef(false)
  useMemo(() => {
    if (!decodedWbs || heroLoaded.current) return
    heroLoaded.current = true
    supabase.storage.from('pep-evidencias').list(`${decodedWbs}/_hero`).then(({ data }) => {
      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage.from('pep-evidencias').getPublicUrl(`${decodedWbs}/_hero/${data[0].name}`)
        setHeroImage(urlData.publicUrl)
      }
    })
  }, [decodedWbs])

  const handleHeroUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !decodedWbs) return
    const file = files[0]
    const { data: oldFiles } = await supabase.storage.from('pep-evidencias').list(`${decodedWbs}/_hero`)
    if (oldFiles && oldFiles.length > 0) {
      await supabase.storage.from('pep-evidencias').remove(oldFiles.map(f => `${decodedWbs}/_hero/${f.name}`))
    }
    const path = `${decodedWbs}/_hero/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('pep-evidencias').upload(path, file)
    if (error) { toast.error('Erro ao enviar imagem'); return }
    const { data: urlData } = supabase.storage.from('pep-evidencias').getPublicUrl(path)
    setHeroImage(urlData.publicUrl)
    toast.success('Imagem atualizada')
  }, [decodedWbs])

  const handleRemoveHero = useCallback(async () => {
    if (!decodedWbs) return
    const { data: oldFiles } = await supabase.storage.from('pep-evidencias').list(`${decodedWbs}/_hero`)
    if (oldFiles && oldFiles.length > 0) {
      await supabase.storage.from('pep-evidencias').remove(oldFiles.map(f => `${decodedWbs}/_hero/${f.name}`))
    }
    setHeroImage(null)
    toast.success('Imagem removida')
  }, [decodedWbs])

  const handleSaveDescricao = useCallback(async () => {
    if (!entry) return
    const { error } = await supabase.from('pep_entries').update({ resumo_executivo: descricaoEdit }).eq('id', entry.id)
    if (error) { toast.error('Erro ao salvar resumo'); return }
    await logChange(entry.id, 'resumo_executivo', entry.resumo_executivo ?? null, descricaoEdit)
    setEditingDescricao(false)
    toast.success('Resumo executivo atualizado')
  }, [entry, descricaoEdit])

  if (loadingEntries) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-2xl font-bold text-muted-foreground">Item não encontrado</p>
        <p className="text-sm text-muted-foreground">WBS: {decodedWbs}</p>
        <Button variant="outline" onClick={() => navigate('/pep')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao PEP
        </Button>
      </div>
    )
  }

  const statusCfg = STATUS_MAP[gestao?.status ?? 'nao_iniciado'] ?? STATUS_MAP.nao_iniciado
  const riscoCfg = RISCO_MAP[gestao?.nivel_risco ?? 'baixo'] ?? RISCO_MAP.baixo
  const progresso = gestao?.progresso ?? 0

  return (
    <div className="space-y-6">
      {/* ─── Cabeçalho ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-lg hover:bg-primary/10" onClick={() => navigate('/pep')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="font-mono text-xs gradient-bid text-white px-2.5 py-1 rounded-lg shadow-sm">WBS {entry.codigo_wbs}</span>
            <Badge variant="outline" className="text-xs rounded-full">{REF_LABELS[entry.ref] ?? entry.ref}</Badge>
            <Badge className={cn('text-xs rounded-full', statusCfg.color)}>{statusCfg.label}</Badge>
          </div>
          <h1 className="text-xl font-bold text-foreground pl-10">{entry.descricao ?? 'Sem descrição'}</h1>
          {entry.secretaria && <p className="text-sm text-muted-foreground pl-10">Secretaria: {entry.secretaria}</p>}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setEditing(false)}><X className="w-4 h-4 mr-1" />Cancelar</Button>
              <Button size="sm" className="rounded-lg" onClick={handleSave} disabled={upsertGestao.isPending}><Save className="w-4 h-4 mr-1" />Salvar</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="rounded-lg" onClick={startEdit}><Edit2 className="w-4 h-4 mr-1" />Editar</Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="pl-10 pr-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-16">Progresso</span>
          <Progress value={progresso} className="flex-1 h-2.5 rounded-full" />
          <span className="text-sm font-semibold w-10 text-right">{progresso}%</span>
        </div>
      </div>

      {/* ─── Hero Image + Descrição ─────────────────────────────── */}
      <Card className="overflow-hidden rounded-xl border-0 shadow-md">
        <div className="flex flex-col sm:flex-row">
          {/* Image — 1/4 width */}
          <div className="relative group sm:w-1/4 flex-shrink-0">
            {heroImage ? (
              <img src={heroImage} alt={entry.descricao ?? 'Imagem do item PEP'} className="w-full h-48 sm:h-full object-cover" />
            ) : (
              <div className="w-full h-48 sm:h-full min-h-[160px] bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                <img src={logoPoaSocial} alt="POA+ Social" className="h-20 opacity-40" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex flex-col gap-1">
                <Button variant="secondary" size="sm" className="shadow-lg rounded-lg" onClick={() => heroInputRef.current?.click()}>
                  <Camera className="w-4 h-4 mr-1" />{heroImage ? 'Trocar' : 'Adicionar'}
                </Button>
                {heroImage && (
                  <Button variant="destructive" size="sm" className="shadow-lg rounded-lg" onClick={handleRemoveHero}>
                    <Trash2 className="w-4 h-4 mr-1" />Remover
                  </Button>
                )}
              </div>
            </div>
            <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleHeroUpload(e.target.files)} />
          </div>

          {/* Description — 3/4 width */}
          <div className="sm:w-3/4 p-6 flex flex-col justify-center">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Resumo Executivo</p>
            {editingDescricao ? (
              <div className="flex gap-2">
                <Textarea value={descricaoEdit} onChange={(e) => setDescricaoEdit(e.target.value)} placeholder="Descreva o resumo executivo deste item..." className="min-h-[100px] flex-1 rounded-lg" />
                <div className="flex flex-col gap-1">
                  <Button size="sm" className="rounded-lg" onClick={handleSaveDescricao}><Save className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setEditingDescricao(false)}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer hover:bg-muted/30 rounded-xl p-3 -m-3 transition-all duration-200 group/desc"
                onClick={() => { setDescricaoEdit(entry.resumo_executivo ?? ''); setEditingDescricao(true) }}
              >
                <p className="text-sm text-foreground leading-relaxed">
                  {entry.resumo_executivo || <span className="italic text-muted-foreground">Clique para adicionar um resumo executivo...</span>}
                </p>
                <span className="text-[10px] text-muted-foreground/50 opacity-0 group-hover/desc:opacity-100 transition-opacity mt-1 block">Clique para editar</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Col 1-2: Main content ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Painel Financeiro */}
          <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 gradient-bid-subtle">
              <CardTitle className="text-base gradient-bid-text">Painel Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniCard label="BID (USD)" value={fUSD(entry.n_atual)} />
                <MiniCard label="Local (USD)" value={fUSD(entry.o_atual)} />
                <MiniCard label="Total (USD)" value={fUSD(entry.p_atual)} />
                <MiniCard label="Total (BRL)" value={fBRL(entry.m_reais_total)} />
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Desembolso Previsto por Ano (USD)</p>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {ANOS_FIN.map(a => (
                    <div key={a} className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/20 p-2.5 hover-lift">
                      <p className="text-[10px] text-muted-foreground">{a}</p>
                      <p className="text-xs font-semibold">{fUSD((entry as any)[`desembolso_${a}`])}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gestão da Execução */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Gestão da Execução</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Nível de Risco</label>
                      <Select value={form.nivel_risco} onValueChange={v => setForm(f => ({ ...f, nivel_risco: v }))}>
                        <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(RISCO_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Progresso: {form.progresso}%</label>
                    <Slider value={[form.progresso]} onValueChange={([v]) => setForm(f => ({ ...f, progresso: v }))} max={100} step={5} className="mt-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Início Real</label>
                      <Input type="date" value={form.data_inicio_real} onChange={e => setForm(f => ({ ...f, data_inicio_real: e.target.value }))} className="mt-1 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Previsão de Término</label>
                      <Input type="date" value={form.data_fim_previsto} onChange={e => setForm(f => ({ ...f, data_fim_previsto: e.target.value }))} className="mt-1 rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Tipo de Aquisição</label>
                      <Input value={form.tipo_aquisicao} onChange={e => setForm(f => ({ ...f, tipo_aquisicao: e.target.value }))} className="mt-1 rounded-lg" placeholder="Ex: Obras, Bens, Consultoria" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Método de Aquisição</label>
                      <Input value={form.metodo_aquisicao} onChange={e => setForm(f => ({ ...f, metodo_aquisicao: e.target.value }))} className="mt-1 rounded-lg" placeholder="Ex: LPN, SBC, CD" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Notas de Gestão</label>
                    <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} className="mt-1 rounded-lg" rows={3} placeholder="Observações sobre andamento..." />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <InfoField label="Status" value={statusCfg.label} />
                    <InfoField label="Nível de Risco" value={<Badge className={cn('text-xs rounded-full', riscoCfg.color)}>{riscoCfg.label}</Badge>} />
                    <InfoField label="Início Real" value={gestao?.data_inicio_real ?? '—'} />
                    <InfoField label="Prev. Término" value={gestao?.data_fim_previsto ?? '—'} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoField label="Tipo Aquisição" value={entry.tipo_aquisicao ?? '—'} />
                    <InfoField label="Método Aquisição" value={entry.metodo_aquisicao ?? '—'} />
                  </div>
                  {gestao?.notas && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Notas de Gestão</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/20 rounded-xl p-4">{gestao.notas}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Impedimentos */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
                </div>
                Impedimentos ({impedimentos.filter(i => !i.resolvido).length} abertos)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Descrever impedimento..." value={newImpedimento} onChange={e => setNewImpedimento(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddImpedimento()} className="rounded-lg" />
                <Button size="sm" className="rounded-lg" onClick={handleAddImpedimento} disabled={!newImpedimento.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {impedimentos.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhum impedimento registrado</p>}
              <div className="space-y-1">
                {impedimentos.map(imp => (
                  <div key={imp.id} className="flex items-center gap-2 group p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <Checkbox
                      checked={imp.resolvido}
                      onCheckedChange={checked => entry && toggleImpedimento.mutate({ id: imp.id, resolvido: !!checked, pep_entry_id: entry.id })}
                    />
                    <span className={cn('text-sm flex-1', imp.resolvido && 'line-through text-muted-foreground')}>{imp.descricao}</span>
                    <Button
                      variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 rounded-lg"
                      onClick={() => entry && deleteImpedimento.mutate({ id: imp.id, pep_entry_id: entry.id })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evidências */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Repositório de Evidências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-muted-foreground/15 rounded-xl p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); handleFileUpload(e.dataTransfer.files) }}
              >
                <Upload className="w-6 h-6 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Arraste arquivos ou clique para enviar</p>
                <p className="text-xs text-muted-foreground/50 mt-1">PDFs, imagens, documentos</p>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} />
              </div>

              {evidencias.filter(f => isImageFile(f.name)).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Imagens</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {evidencias.filter(f => isImageFile(f.name)).map(f => {
                      const url = getEvidenciaUrl(decodedWbs, f.name)
                      return (
                        <div key={f.name} className="relative group rounded-xl overflow-hidden border aspect-square bg-muted cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setLightboxUrl(url)}>
                          <img src={url} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <Button
                            variant="destructive" size="icon"
                            className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 rounded-lg"
                            onClick={e => { e.stopPropagation(); deleteEvidencia.mutate({ wbs: decodedWbs, fileName: f.name }) }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {evidencias.filter(f => !isImageFile(f.name)).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Documentos</p>
                  <div className="space-y-1">
                    {evidencias.filter(f => !isImageFile(f.name)).map(f => {
                      const url = getEvidenciaUrl(decodedWbs, f.name)
                      const displayName = f.name.replace(/^\d+_/, '')
                      return (
                        <div key={f.name} className="flex items-center gap-2 text-sm group p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 truncate">{displayName}</span>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg"><Download className="w-3 h-3" /></Button>
                          </a>
                          <Button
                            variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 rounded-lg"
                            onClick={() => deleteEvidencia.mutate({ wbs: decodedWbs, fileName: f.name })}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {evidencias.length === 0 && <p className="text-xs text-muted-foreground text-center">Nenhum arquivo enviado</p>}
            </CardContent>
          </Card>
        </div>

        {/* ─── Col 3: Sidebar ─────────────────────────────────────── */}
        <div className="space-y-6">
          {children.length > 0 && (
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Subatividades ({children.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {children.map(c => (
                    <Link
                      key={c.id}
                      to={`/pep/${encodeURIComponent(c.codigo_wbs ?? '')}`}
                      className="flex items-center gap-2 text-sm hover:bg-muted/30 rounded-lg px-2 py-2 transition-all duration-200 hover-lift"
                    >
                      <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0">{c.codigo_wbs}</span>
                      <span className="truncate text-foreground">{c.descricao}</span>
                      <Badge variant="outline" className="text-[9px] ml-auto flex-shrink-0 rounded-full">{c.ref}</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Entregas Físicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                {(['2025', '2026', '2027', '2028', '2029', 'eop'] as const).map(a => {
                  const key = `fisica_${a}` as keyof PepEntry
                  const val = (entry as any)[key] as number | null
                  return (
                    <div key={a} className={cn('rounded-xl p-2 transition-colors', val === 1 ? 'bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10' : 'bg-muted/20')}>
                      <p className="text-[10px] text-muted-foreground">{a === 'eop' ? 'EOP' : a}</p>
                      <p className="text-xs font-semibold">{val === 1 ? '✓' : '—'}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Histórico de Alterações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhuma alteração registrada</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                  {historico.map(h => (
                    <div key={h.id} className="text-xs border-l-2 border-primary/20 pl-3 py-1.5 hover:bg-muted/20 rounded-r-lg transition-colors">
                      <p className="font-medium text-foreground">{h.campo}</p>
                      <p className="text-muted-foreground">
                        {h.valor_anterior ?? '(vazio)'} → <span className="text-foreground">{h.valor_novo ?? '(vazio)'}</span>
                      </p>
                      <p className="text-muted-foreground/50 text-[10px]">
                        {new Date(h.created_at).toLocaleString('pt-BR')} · {h.usuario}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-2 rounded-2xl">
          {lightboxUrl && <img src={lightboxUrl} alt="Evidência" className="w-full h-auto rounded-xl" />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Helper components ────────────────────────────────────────────────────────
function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-b from-muted/40 to-muted/10 p-3 hover-lift">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  )
}
