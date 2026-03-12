import { useState, useRef, type DragEvent } from 'react'
import { Plus, MoreHorizontal, Pencil, Bell, MessageSquare, Trash2, Calendar, User, GripVertical, AlertTriangle, ListChecks, X } from 'lucide-react'
import { HelpTooltip } from '@/components/HelpTooltip'
import {
  useAtividades, useUpdateAtividadeStatus, useUpdateAtividade,
  useCreateAtividade, useDeleteAtividade,
  useComentarios, useCreateComentario,
  useAlertas, useCreateAlerta, useToggleAlertaResolvido,
  useAtividadeCounts,
  useChecklist, useCreateChecklistItem, useToggleChecklistItem, useDeleteChecklistItem,
} from '@/lib/queries/activities'
import { type Atividade, type AtividadeAlerta } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const COLUMNS: { key: Atividade['status']; label: string; color: string }[] = [
  { key: 'todo',     label: 'A Fazer',      color: 'bg-muted' },
  { key: 'progress', label: 'Em Andamento',  color: 'bg-accent/10' },
  { key: 'waiting',  label: 'Aguardando',    color: 'bg-yellow-50 dark:bg-yellow-950/20' },
  { key: 'done',     label: 'Concluído',     color: 'bg-green-50 dark:bg-green-950/20' },
]

const PRIORIDADE_COLOR: Record<string, string> = {
  Alta:  'bg-destructive/15 text-destructive',
  Media: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Baixa: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const COLOR_PALETTE = [
  { hex: '#3b82f6', label: 'Azul' },
  { hex: '#10b981', label: 'Verde' },
  { hex: '#f59e0b', label: 'Amarelo' },
  { hex: '#ef4444', label: 'Vermelho' },
  { hex: '#8b5cf6', label: 'Roxo' },
  { hex: '#ec4899', label: 'Rosa' },
  { hex: '#06b6d4', label: 'Ciano' },
  { hex: '#6b7280', label: 'Cinza' },
]

const EMPTY_ATV: Partial<Atividade> = {
  titulo: '', descricao: '', componente: '', responsavel: '',
  prazo: '', prioridade: 'Media', status: 'todo', progresso: 0, cor: null,
}

export default function Activities() {
  const { data: atividades = [], isLoading } = useAtividades()
  const { data: counts } = useAtividadeCounts()
  const updateStatus = useUpdateAtividadeStatus()
  const updateAtv = useUpdateAtividade()
  const createAtv = useCreateAtividade()
  const deleteAtv = useDeleteAtividade()

  // Dialogs state
  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<Partial<Atividade>>(EMPTY_ATV)
  const [isNew, setIsNew] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Sheets state
  const [commentId, setCommentId] = useState<string | null>(null)
  const [alertId, setAlertId] = useState<string | null>(null)
  const [checklistId, setChecklistId] = useState<string | null>(null)

  // DnD state
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  // Filters
  const [filterResponsible, setFilterResponsible] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const hoje = new Date().toISOString().split('T')[0]
  const responsibles = [...new Set(atividades.map(a => a.responsavel).filter(Boolean))]

  const filtered = atividades.filter(a => {
    if (filterResponsible !== 'all' && a.responsavel !== filterResponsible) return false
    if (filterPriority !== 'all' && a.prioridade !== filterPriority) return false
    return true
  })

  // ─── DnD handlers ────────────────────────────
  const handleDragStart = (e: DragEvent, id: string) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
  const handleDragOver = (e: DragEvent, colKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(colKey)
  }
  const handleDragLeave = () => setDropTarget(null)
  const handleDrop = (e: DragEvent, colKey: Atividade['status']) => {
    e.preventDefault()
    setDropTarget(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      const atv = atividades.find(a => a.id === id)
      if (atv && atv.status !== colKey) {
        updateStatus.mutate({ id, status: colKey })
        toast.success(`Movido para "${COLUMNS.find(c => c.key === colKey)?.label}"`)
      }
    }
    setDragId(null)
  }

  // ─── Edit dialog ─────────────────────────────
  const openNew = () => { setIsNew(true); setEditData({ ...EMPTY_ATV }); setEditOpen(true) }
  const openEdit = (atv: Atividade) => { setIsNew(false); setEditData({ ...atv }); setEditOpen(true) }

  const handleSave = async () => {
    if (!editData.titulo) return
    if (isNew) {
      await createAtv.mutateAsync(editData as Omit<Atividade, 'id' | 'criado_em' | 'atualizado_em'>)
      toast.success('Atividade criada')
    } else {
      await updateAtv.mutateAsync(editData as Partial<Atividade> & { id: string })
      toast.success('Atividade atualizada')
    }
    setEditOpen(false)
  }

  // ─── Delete ──────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    await deleteAtv.mutateAsync(deleteId)
    toast.success('Atividade excluída')
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Atividades</h1>
            <HelpTooltip id="kanban-atividades" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Painel Kanban — arraste cards entre colunas</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Atividade
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterResponsible} onValueChange={setFilterResponsible}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os responsáveis</SelectItem>
            {responsibles.map(r => <SelectItem key={r!} value={r!}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Media">Média</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-8 bg-muted rounded" />
              {[...Array(3)].map((_, j) => <div key={j} className="h-24 bg-muted rounded" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const items = filtered.filter(a => a.status === col.key)
            const isDrop = dropTarget === col.key
            return (
              <div
                key={col.key}
                className={cn('flex flex-col gap-2 min-h-[200px] rounded-lg transition-colors p-1', isDrop && 'ring-2 ring-primary/50 bg-primary/5')}
                onDragOver={e => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, col.key)}
              >
                <div className={cn('rounded-lg px-3 py-2 flex items-center justify-between', col.color)}>
                  <span className="text-sm font-medium">{col.label}</span>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>

                {items.length === 0 ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center flex-1 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Arraste cards aqui</p>
                  </div>
                ) : (
                  items.map(atv => {
                    const atrasado = atv.prazo && atv.prazo < hoje && atv.status !== 'done'
                    const alertCount = counts?.alertMap[atv.id] || 0
                    const commentCount = counts?.commentMap[atv.id] || 0
                    const cl = counts?.checklistMap?.[atv.id]
                    return (
                      <Card
                        key={atv.id}
                        draggable
                        onDragStart={e => handleDragStart(e, atv.id)}
                        onDragEnd={() => setDragId(null)}
                        className={cn(
                          'p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all',
                          dragId === atv.id && 'opacity-40 scale-95',
                          atrasado && 'border-destructive/50 bg-destructive/5',
                        )}
                        style={atv.cor ? { borderLeft: `4px solid ${atv.cor}` } : undefined}
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                            <p className="text-sm font-medium leading-tight line-clamp-2">{atv.titulo}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', PRIORIDADE_COLOR[atv.prioridade])}>
                              {atv.prioridade}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(atv)}>
                                  <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCommentId(atv.id)}>
                                  <MessageSquare className="h-3.5 w-3.5 mr-2" /> Comentários
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setChecklistId(atv.id)}>
                                  <ListChecks className="h-3.5 w-3.5 mr-2" /> Checklist
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAlertId(atv.id)}>
                                  <Bell className="h-3.5 w-3.5 mr-2" /> Alertas
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteId(atv.id)} className="text-destructive">
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {atv.componente && <p className="text-xs text-muted-foreground mb-1 ml-5">{atv.componente}</p>}

                        {(atv.progresso ?? 0) > 0 && (
                          <div className="mb-2 ml-5">
                            <Progress value={atv.progresso} className="h-1.5" />
                            <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{atv.progresso}%</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 ml-5">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {atv.responsavel && (
                              <span className="flex items-center gap-1 truncate max-w-[80px]">
                                <User className="h-3 w-3" />{atv.responsavel}
                              </span>
                            )}
                            {atv.prazo && (
                              <span className={cn('flex items-center gap-1 tabular-nums', atrasado && 'text-destructive font-medium')}>
                                <Calendar className="h-3 w-3" />
                                {new Date(atv.prazo + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {alertCount > 0 && (
                              <button onClick={() => setAlertId(atv.id)} className="flex items-center gap-0.5 text-destructive" title="Alertas pendentes">
                                <Bell className="h-3 w-3" />
                                <span className="text-[10px] font-bold">{alertCount}</span>
                              </button>
                            )}
                            {commentCount > 0 && (
                              <button onClick={() => setCommentId(atv.id)} className="flex items-center gap-0.5 text-muted-foreground" title="Comentários">
                                <MessageSquare className="h-3 w-3" />
                                <span className="text-[10px]">{commentCount}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Edit / Create Dialog ─── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{isNew ? 'Nova Atividade' : 'Editar Atividade'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Título</Label>
              <Input value={editData.titulo ?? ''} onChange={e => setEditData(p => ({ ...p, titulo: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={editData.descricao ?? ''} onChange={e => setEditData(p => ({ ...p, descricao: e.target.value }))} className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Componente</Label>
                <Input value={editData.componente ?? ''} onChange={e => setEditData(p => ({ ...p, componente: e.target.value }))} className="mt-1" placeholder="Ex: C2 — Reabilitação" />
              </div>
              <div>
                <Label>Responsável</Label>
                <Input value={editData.responsavel ?? ''} onChange={e => setEditData(p => ({ ...p, responsavel: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prazo</Label>
                <Input type="date" value={editData.prazo ?? ''} onChange={e => setEditData(p => ({ ...p, prazo: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={editData.prioridade} onValueChange={v => setEditData(p => ({ ...p, prioridade: v as Atividade['prioridade'] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Alta', 'Media', 'Baixa'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Progresso: {editData.progresso ?? 0}%</Label>
              <Slider
                value={[editData.progresso ?? 0]}
                onValueChange={([v]) => setEditData(p => ({ ...p, progresso: v }))}
                max={100} step={5} className="mt-2"
              />
            </div>
            <div>
              <Label>Cor do card</Label>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setEditData(p => ({ ...p, cor: null }))}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs',
                    !editData.cor ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                  )}
                  title="Sem cor"
                >✕</button>
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => setEditData(p => ({ ...p, cor: c.hex }))}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                      editData.cor === c.hex ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createAtv.isPending || updateAtv.isPending}>
              {(createAtv.isPending || updateAtv.isPending) ? 'Salvando...' : isNew ? 'Criar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm ─── */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os comentários e alertas associados também serão excluídos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Comments Sheet ─── */}
      <CommentsSheet atividadeId={commentId} onClose={() => setCommentId(null)} />

      {/* ─── Alerts Sheet ─── */}
      <AlertsSheet atividadeId={alertId} onClose={() => setAlertId(null)} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Comments Sheet
// ═══════════════════════════════════════════════════════════════════════════

function CommentsSheet({ atividadeId, onClose }: { atividadeId: string | null; onClose: () => void }) {
  const { data: comments = [], isLoading } = useComentarios(atividadeId)
  const createComment = useCreateComentario()
  const [texto, setTexto] = useState('')
  const [autor, setAutor] = useState('')

  const handleAdd = async () => {
    if (!texto.trim() || !atividadeId) return
    await createComment.mutateAsync({ atividade_id: atividadeId, texto: texto.trim(), autor: autor.trim() || null })
    setTexto('')
    toast.success('Comentário adicionado')
  }

  return (
    <Sheet open={!!atividadeId} onOpenChange={o => !o && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader><SheetTitle>Comentários</SheetTitle></SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {comments.length === 0 && !isLoading && <p className="text-sm text-muted-foreground text-center py-8">Nenhum comentário ainda</p>}
          {comments.map(c => (
            <div key={c.id} className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{c.autor || 'Anônimo'}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(c.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm">{c.texto}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 space-y-2">
          <Input placeholder="Seu nome (opcional)" value={autor} onChange={e => setAutor(e.target.value)} />
          <div className="flex gap-2">
            <Textarea placeholder="Escreva um comentário..." value={texto} onChange={e => setTexto(e.target.value)} rows={2} className="flex-1" />
            <Button onClick={handleAdd} disabled={createComment.isPending || !texto.trim()} className="self-end">Enviar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Alerts Sheet
// ═══════════════════════════════════════════════════════════════════════════

const ALERT_TYPES: { value: AtividadeAlerta['tipo']; label: string; color: string }[] = [
  { value: 'info',    label: 'Info',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'warning', label: 'Atenção',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'urgent',  label: 'Urgente',  color: 'bg-destructive/15 text-destructive' },
]

function AlertsSheet({ atividadeId, onClose }: { atividadeId: string | null; onClose: () => void }) {
  const { data: alertas = [], isLoading } = useAlertas(atividadeId)
  const createAlerta = useCreateAlerta()
  const toggleResolvido = useToggleAlertaResolvido()
  const [mensagem, setMensagem] = useState('')
  const [tipo, setTipo] = useState<AtividadeAlerta['tipo']>('info')

  const handleAdd = async () => {
    if (!mensagem.trim() || !atividadeId) return
    await createAlerta.mutateAsync({ atividade_id: atividadeId, mensagem: mensagem.trim(), tipo, resolvido: false })
    setMensagem('')
    toast.success('Alerta adicionado')
  }

  return (
    <Sheet open={!!atividadeId} onOpenChange={o => !o && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader><SheetTitle>Alertas</SheetTitle></SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {alertas.length === 0 && !isLoading && <p className="text-sm text-muted-foreground text-center py-8">Nenhum alerta</p>}
          {alertas.map(a => {
            const typeInfo = ALERT_TYPES.find(t => t.value === a.tipo) || ALERT_TYPES[0]
            return (
              <div key={a.id} className={cn('rounded-lg border p-3 space-y-2', a.resolvido && 'opacity-50')}>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn('text-[10px]', typeInfo.color)}>{typeInfo.label}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(a.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <p className={cn('text-sm', a.resolvido && 'line-through')}>{a.mensagem}</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={a.resolvido}
                    onCheckedChange={v => toggleResolvido.mutate({ id: a.id, resolvido: !!v, atividade_id: a.atividade_id })}
                  />
                  <span className="text-xs text-muted-foreground">Resolvido</span>
                </label>
              </div>
            )
          })}
        </div>
        <div className="border-t pt-3 space-y-2">
          <div className="flex gap-2">
            <Select value={tipo} onValueChange={v => setTipo(v as AtividadeAlerta['tipo'])}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALERT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Mensagem do alerta" value={mensagem} onChange={e => setMensagem(e.target.value)} className="flex-1" />
          </div>
          <Button onClick={handleAdd} disabled={createAlerta.isPending || !mensagem.trim()} className="w-full">
            <AlertTriangle className="h-4 w-4 mr-2" /> Adicionar Alerta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
