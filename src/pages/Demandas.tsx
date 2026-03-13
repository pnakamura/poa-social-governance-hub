import { useState, useRef } from 'react'
import {
  Inbox, Sparkles, AlertCircle, CheckCircle2, Clock, ChevronDown,
  ChevronUp, Plus, Filter, Search, X, History, FileText, MessageSquare,
  Mail, Mic, Paperclip, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  useDemandas, useInboxCapturas, useDemandasByCaptura,
  useDemandaHistorico, useUpdateDemandaStatus, useCancelarDemanda,
  useUpdateDemanda, useCreateDemanda,
  parseInbox, type ParseInboxPayload, type ParseInboxResult
} from '@/lib/queries/demandas'
import { type Demanda, type InboxCaptura } from '@/lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIPO_FONTE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  whatsapp:    { label: 'WhatsApp',         icon: <MessageSquare className="h-3.5 w-3.5" /> },
  email:       { label: 'E-mail',           icon: <Mail className="h-3.5 w-3.5" /> },
  ata_reuniao: { label: 'Ata de Reunião',   icon: <FileText className="h-3.5 w-3.5" /> },
  comunicado:  { label: 'Comunicado',       icon: <FileText className="h-3.5 w-3.5" /> },
  transcricao: { label: 'Transcrição',      icon: <Mic className="h-3.5 w-3.5" /> },
  processo:    { label: 'Processo SEI',     icon: <FileText className="h-3.5 w-3.5" /> },
  outro:       { label: 'Outro',            icon: <Inbox className="h-3.5 w-3.5" /> },
}

const TIPO_DEMANDA_COLOR: Record<string, string> = {
  acao:       'bg-blue-100 text-blue-800 border-blue-200',
  decisao:    'bg-purple-100 text-purple-800 border-purple-200',
  pendencia:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  informacao: 'bg-gray-100 text-gray-800 border-gray-200',
  alerta:     'bg-red-100 text-red-800 border-red-200',
}

const TIPO_DEMANDA_LABEL: Record<string, string> = {
  acao: 'Ação', decisao: 'Decisão', pendencia: 'Pendência',
  informacao: 'Informação', alerta: 'Alerta',
}

const PRIORIDADE_COLOR: Record<string, string> = {
  Alta:  'bg-red-500 text-white',
  Media: 'bg-yellow-500 text-white',
  Baixa: 'bg-green-500 text-white',
}

const STATUS_LABEL: Record<string, string> = {
  aberta: 'Aberta', em_andamento: 'Em andamento',
  aguardando: 'Aguardando', concluida: 'Concluída', cancelada: 'Cancelada',
}

function isAtrasada(prazo: string | null, status: string): boolean {
  if (!prazo || status === 'concluida' || status === 'cancelada') return false
  return new Date(prazo) < new Date()
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

// ── Card de Demanda ───────────────────────────────────────────────────────────

function DemandaCard({
  demanda,
  onStatusChange,
  onEdit,
  onHistorico,
}: {
  demanda: Demanda
  onStatusChange: (id: string, status: Demanda['status'], anterior: string) => void
  onEdit: (d: Demanda) => void
  onHistorico: (d: Demanda) => void
}) {
  const atrasada = isAtrasada(demanda.prazo, demanda.status)

  return (
    <Card className={`border ${atrasada ? 'border-red-300 bg-red-50/30' : 'border-border'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Prioridade */}
          <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${PRIORIDADE_COLOR[demanda.prioridade]}`}>
            {demanda.prioridade}
          </span>

          <div className="flex-1 min-w-0">
            {/* Título + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm leading-snug">{demanda.titulo}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${TIPO_DEMANDA_COLOR[demanda.tipo] ?? ''}`}>
                {TIPO_DEMANDA_LABEL[demanda.tipo] ?? demanda.tipo}
              </span>
              {demanda.extraido_por_ia && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" /> IA
                </span>
              )}
            </div>

            {/* Descrição */}
            {demanda.descricao && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{demanda.descricao}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              {demanda.responsavel && (
                <span className="font-medium text-foreground">{demanda.responsavel}</span>
              )}
              {demanda.prazo && (
                <span className={atrasada ? 'text-red-600 font-semibold' : ''}>
                  {atrasada ? '⚠ Atrasado · ' : ''}Prazo: {formatDate(demanda.prazo)}
                </span>
              )}
              {demanda.fonte_descricao && (
                <span className="italic">{demanda.fonte_descricao}</span>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 shrink-0">
            <Select
              value={demanda.status}
              onValueChange={(v) => onStatusChange(demanda.id, v as Demanda['status'], demanda.status)}
            >
              <SelectTrigger className="h-7 text-xs w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onHistorico(demanda)} title="Histórico">
              <History className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(demanda)} title="Editar">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Modal Histórico ───────────────────────────────────────────────────────────

function HistoricoModal({ demanda, open, onClose }: { demanda: Demanda | null; open: boolean; onClose: () => void }) {
  const { data: historico = [], isLoading } = useDemandaHistorico(demanda?.id ?? null)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold truncate">{demanda?.titulo}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : historico.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma alteração registrada.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {historico.map((h) => (
              <div key={h.id} className="text-xs border-l-2 border-border pl-3 py-1">
                <span className="font-medium">{h.campo}</span>
                {h.valor_anterior && <span className="text-muted-foreground"> · {h.valor_anterior} →</span>}
                <span className="text-foreground"> {h.valor_novo}</span>
                <div className="text-muted-foreground mt-0.5">{new Date(h.created_at).toLocaleString('pt-BR')}</div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Modal Editar ──────────────────────────────────────────────────────────────

function EditarDemandaModal({ demanda, open, onClose }: { demanda: Demanda | null; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Demanda>>({})
  const update = useUpdateDemanda()

  if (!demanda) return null

  const handleOpen = () => setForm({
    titulo: demanda.titulo,
    descricao: demanda.descricao ?? '',
    responsavel: demanda.responsavel ?? '',
    prazo: demanda.prazo ?? '',
    prioridade: demanda.prioridade,
    status: demanda.status,
  })

  const handleSave = async () => {
    const historico = []
    if (form.status !== demanda.status) historico.push({ campo: 'status', anterior: demanda.status, novo: form.status! })
    if (form.responsavel !== demanda.responsavel) historico.push({ campo: 'responsavel', anterior: demanda.responsavel ?? '', novo: form.responsavel ?? '' })
    if (form.prazo !== demanda.prazo) historico.push({ campo: 'prazo', anterior: demanda.prazo ?? '', novo: form.prazo ?? '' })

    await update.mutateAsync({ id: demanda.id, changes: form, historico })
    toast.success('Demanda atualizada')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) handleOpen(); else onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Editar Demanda</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título</Label>
            <Input value={form.titulo ?? ''} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={form.descricao ?? ''} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input value={form.responsavel ?? ''} onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Prazo</Label>
              <Input type="date" value={form.prazo ?? ''} onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value }))} className="text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm((f) => ({ ...f, prioridade: v as Demanda['prioridade'] }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Demanda['status'] }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={update.isPending}>
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Seção Captura ─────────────────────────────────────────────────────────────

function SecaoCaptura({ onSaved }: { onSaved: () => void }) {
  const [tipoFonte, setTipoFonte] = useState<InboxCaptura['tipo_fonte']>('email')
  const [texto, setTexto] = useState('')
  const [autorFonte, setAutorFonte] = useState('')
  const [dataFonte, setDataFonte] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<ParseInboxResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setTexto(ev.target?.result as string ?? '')
    reader.readAsText(file, 'utf-8')
  }

  const handleProcessar = async () => {
    if (!texto.trim() || texto.trim().length < 10) {
      toast.error('Cole um texto com pelo menos 10 caracteres.')
      return
    }
    setLoading(true)
    setPreview(null)
    try {
      const payload: ParseInboxPayload = {
        texto,
        tipo_fonte: tipoFonte,
        autor_fonte: autorFonte || undefined,
        data_fonte: dataFonte || undefined,
        salvar: false, // prévia primeiro
      }
      const result = await parseInbox(payload)
      setPreview(result)
    } catch (err) {
      toast.error('Erro ao processar: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmar = async () => {
    if (!preview) return
    setLoading(true)
    try {
      await parseInbox({
        texto,
        tipo_fonte: tipoFonte,
        autor_fonte: autorFonte || undefined,
        data_fonte: dataFonte || undefined,
        salvar: true,
      })
      toast.success(`${preview.total} demanda(s) salva(s) com sucesso!`)
      setTexto('')
      setAutorFonte('')
      setDataFonte('')
      setPreview(null)
      onSaved()
    } catch (err) {
      toast.error('Erro ao salvar: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" />
          Nova Captura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Metadados */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs mb-1 block">Tipo de fonte</Label>
            <Select value={tipoFonte} onValueChange={(v) => setTipoFonte(v as InboxCaptura['tipo_fonte'])}>
              <SelectTrigger className="text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_FONTE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-sm">
                    <span className="flex items-center gap-1.5">{v.icon} {v.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Remetente / Autor</Label>
            <Input
              placeholder="ex: Marcelo Alfaro (BID)"
              value={autorFonte}
              onChange={(e) => setAutorFonte(e.target.value)}
              className="text-sm h-8"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Data do documento</Label>
            <Input
              type="date"
              value={dataFonte}
              onChange={(e) => setDataFonte(e.target.value)}
              className="text-sm h-8"
            />
          </div>
        </div>

        {/* Texto */}
        <div>
          <Label className="text-xs mb-1 block">Texto (cole WhatsApp, e-mail, ata, transcrição...)</Label>
          <Textarea
            placeholder="Cole aqui o conteúdo bruto da conversa, e-mail, ata de reunião ou qualquer outra fonte..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={6}
            className="text-sm font-mono resize-y"
          />
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="h-3.5 w-3.5" />
            Carregar .txt
          </Button>
          <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFile} />

          <Button
            size="sm"
            className="gap-1.5 ml-auto"
            onClick={handleProcessar}
            disabled={loading || texto.trim().length < 10}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {loading ? 'Processando…' : 'Processar com IA'}
          </Button>
        </div>

        {/* Prévia dos resultados */}
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        )}

        {preview && !loading && (
          <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {preview.total > 0
                  ? `${preview.total} item(ns) identificado(s) pela IA`
                  : 'Nenhum item acionável identificado no texto.'}
              </p>
              {preview.total > 0 && (
                <Button size="sm" onClick={handleConfirmar} disabled={loading} className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirmar e Salvar ({preview.total})
                </Button>
              )}
            </div>
            {preview.demandas_extraidas.map((d, i) => (
              <div key={i} className="text-xs bg-background border rounded p-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${TIPO_DEMANDA_COLOR[d.tipo ?? 'acao'] ?? ''}`}>
                    {TIPO_DEMANDA_LABEL[d.tipo ?? 'acao'] ?? d.tipo}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${PRIORIDADE_COLOR[d.prioridade ?? 'Media']}`}>
                    {d.prioridade}
                  </span>
                  <span className="font-medium">{d.titulo}</span>
                </div>
                {d.responsavel && <div className="text-muted-foreground">→ {d.responsavel}{d.prazo ? ` · prazo: ${formatDate(d.prazo)}` : ''}</div>}
                {d.contexto_original && <div className="text-muted-foreground italic line-clamp-1">"{d.contexto_original}"</div>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Seção Capturas Recentes ───────────────────────────────────────────────────

function SecaoCapturas() {
  const { data: capturas = [], isLoading } = useInboxCapturas()
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data: demandasCaptura = [] } = useDemandasByCaptura(expanded)

  if (isLoading) return <Skeleton className="h-20 w-full" />
  if (capturas.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Capturas recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {capturas.slice(0, 10).map((c) => (
          <div key={c.id}>
            <button
              className="w-full text-left flex items-center gap-2 text-xs hover:bg-muted/50 rounded p-1.5 transition-colors"
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            >
              <span className="shrink-0">{TIPO_FONTE_LABELS[c.tipo_fonte]?.icon}</span>
              <span className="flex-1 truncate font-medium">{c.titulo ?? c.texto_bruto.slice(0, 60) + '…'}</span>
              <span className={`shrink-0 text-[10px] px-1 rounded ${c.processado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {c.processado ? `${c.demandas_geradas} demanda(s)` : 'pendente'}
              </span>
              <span className="shrink-0 text-muted-foreground">{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
              {expanded === c.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {expanded === c.id && (
              <div className="ml-6 space-y-1 mt-1">
                {demandasCaptura.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-1.5">Nenhuma demanda vinculada.</p>
                ) : (
                  demandasCaptura.map((d) => (
                    <div key={d.id} className="text-xs flex items-center gap-2 px-1.5 py-0.5 rounded bg-muted/40">
                      <span className={`px-1 rounded text-[10px] ${PRIORIDADE_COLOR[d.prioridade]}`}>{d.prioridade}</span>
                      <span className="truncate">{d.titulo}</span>
                      <span className="shrink-0 text-muted-foreground">{STATUS_LABEL[d.status]}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Demandas() {
  const [filtros, setFiltros] = useState<{ status: string; tipo: string; prioridade: string; busca: string }>({
    status: '', tipo: '', prioridade: '', busca: '',
  })
  const [showFiltros, setShowFiltros] = useState(false)
  const [historicoModal, setHistoricoModal] = useState<Demanda | null>(null)
  const [editModal, setEditModal] = useState<Demanda | null>(null)

  const updateStatus = useUpdateDemandaStatus()
  const cancelar = useCancelarDemanda()

  const filtrosQuery = {
    status: filtros.status || undefined,
    tipo: filtros.tipo || undefined,
    prioridade: filtros.prioridade || undefined,
    busca: filtros.busca || undefined,
  }

  const { data: demandas = [], isLoading, refetch } = useDemandas(filtrosQuery)

  const abertas = demandas.filter((d) => d.status === 'aberta')
  const emAndamento = demandas.filter((d) => d.status === 'em_andamento')
  const aguardando = demandas.filter((d) => d.status === 'aguardando')
  const concluidas = demandas.filter((d) => d.status === 'concluida')
  const atrasadas = demandas.filter((d) => isAtrasada(d.prazo, d.status))

  const handleStatusChange = async (id: string, status: Demanda['status'], anterior: string) => {
    try {
      await updateStatus.mutateAsync({ id, status, valorAnterior: anterior })
      toast.success(`Status atualizado para "${STATUS_LABEL[status]}"`)
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6 text-primary" />
            Demandas & Ações
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Capture textos de qualquer fonte — Claude AI extrai automaticamente ações, decisões e pendências.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Em aberto', value: abertas.length, color: 'text-blue-600', icon: <Inbox className="h-4 w-4" /> },
          { label: 'Em andamento', value: emAndamento.length, color: 'text-purple-600', icon: <Clock className="h-4 w-4" /> },
          { label: 'Atrasadas', value: atrasadas.length, color: 'text-red-600', icon: <AlertCircle className="h-4 w-4" /> },
          { label: 'Concluídas', value: concluidas.length, color: 'text-green-600', icon: <CheckCircle2 className="h-4 w-4" /> },
        ].map((k) => (
          <Card key={k.label} className="text-center py-3">
            <div className={`flex justify-center mb-1 ${k.color}`}>{k.icon}</div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Seção Captura */}
      <SecaoCaptura onSaved={() => refetch()} />

      {/* Seção Demandas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Demandas</h2>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFiltros(!showFiltros)}>
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {Object.values(filtros).some(Boolean) && (
              <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1">
                {Object.values(filtros).filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filtros */}
        {showFiltros && (
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={filtros.busca}
                    onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
                    className="text-sm h-8 pl-7"
                  />
                </div>
                <Select value={filtros.status || 'todos'} onValueChange={(v) => setFiltros((f) => ({ ...f, status: v === 'todos' ? '' : v }))}>
                  <SelectTrigger className="text-sm h-8"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filtros.tipo || 'todos'} onValueChange={(v) => setFiltros((f) => ({ ...f, tipo: v === 'todos' ? '' : v }))}>
                  <SelectTrigger className="text-sm h-8"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {Object.entries(TIPO_DEMANDA_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filtros.prioridade || 'todos'} onValueChange={(v) => setFiltros((f) => ({ ...f, prioridade: v === 'todos' ? '' : v }))}>
                  <SelectTrigger className="text-sm h-8"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as prioridades</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {Object.values(filtros).some(Boolean) && (
                <Button variant="ghost" size="sm" className="mt-2 gap-1 h-7 text-xs" onClick={() => setFiltros({ status: '', tipo: '', prioridade: '', busca: '' })}>
                  <X className="h-3 w-3" /> Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : demandas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma demanda encontrada.</p>
              <p className="text-xs mt-1">Cole um texto na seção acima para começar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {demandas.map((d) => (
              <DemandaCard
                key={d.id}
                demanda={d}
                onStatusChange={handleStatusChange}
                onEdit={setEditModal}
                onHistorico={setHistoricoModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Capturas recentes */}
      <SecaoCapturas />

      {/* Modais */}
      <HistoricoModal demanda={historicoModal} open={!!historicoModal} onClose={() => setHistoricoModal(null)} />
      <EditarDemandaModal demanda={editModal} open={!!editModal} onClose={() => setEditModal(null)} />
    </div>
  )
}
