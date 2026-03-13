import { useState, useMemo, useCallback } from 'react'
import { Plus, Trash2, Pencil, Save, X, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  type PepTarefa, type PepCronogramaFinanceiro,
  FASE_CONFIG, STATUS_TAREFA,
  usePepTarefas, useCreatePepTarefa, useUpdatePepTarefa, useDeletePepTarefa,
  usePepCronogramaFinanceiro,
} from '@/lib/queries/pep-tarefas'

interface Props {
  entryId: string
}

const fUSD = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const EMPTY_FORM = {
  titulo: '', fase: 'planejamento', data_inicio: '', data_fim: '',
  progresso: 0, status: 'pendente', responsavel: '', notas: '', ordem: 0,
}

export default function PepGanttChart({ entryId }: Props) {
  const { data: tarefas = [] } = usePepTarefas(entryId)
  const { data: cronograma = [] } = usePepCronogramaFinanceiro(entryId)
  const createTarefa = useCreatePepTarefa()
  const updateTarefa = useUpdatePepTarefa()
  const deleteTarefa = useDeletePepTarefa()

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Timeline bounds
  const { minDate, maxDate, months } = useMemo(() => {
    const allDates = tarefas.flatMap(t => [new Date(t.data_inicio), new Date(t.data_fim)])
    if (allDates.length === 0) {
      const now = new Date()
      return { minDate: now, maxDate: new Date(now.getFullYear() + 1, now.getMonth(), 1), months: [] as Date[] }
    }
    const min = new Date(Math.min(...allDates.map(d => d.getTime())))
    const max = new Date(Math.max(...allDates.map(d => d.getTime())))
    // Expand to full months
    const start = new Date(min.getFullYear(), min.getMonth(), 1)
    const end = new Date(max.getFullYear(), max.getMonth() + 1, 0)
    const ms: Date[] = []
    const cur = new Date(start)
    while (cur <= end) {
      ms.push(new Date(cur))
      cur.setMonth(cur.getMonth() + 1)
    }
    return { minDate: start, maxDate: end, months: ms }
  }, [tarefas])

  const totalDays = useMemo(() => {
    return Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
  }, [minDate, maxDate])

  const getPosition = useCallback((dateStr: string) => {
    const d = new Date(dateStr)
    const days = (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, Math.min(100, (days / totalDays) * 100))
  }, [minDate, totalDays])

  const openCreate = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM, ordem: tarefas.length + 1 })
    setShowForm(true)
  }

  const openEdit = (t: PepTarefa) => {
    setEditId(t.id)
    setForm({
      titulo: t.titulo, fase: t.fase, data_inicio: t.data_inicio, data_fim: t.data_fim,
      progresso: t.progresso, status: t.status, responsavel: t.responsavel ?? '', notas: t.notas ?? '', ordem: t.ordem,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.data_inicio || !form.data_fim) {
      toast.error('Preencha título, data início e data fim')
      return
    }
    try {
      if (editId) {
        await updateTarefa.mutateAsync({ id: editId, pep_entry_id: entryId, ...form, responsavel: form.responsavel || null, notas: form.notas || null })
        toast.success('Tarefa atualizada')
      } else {
        await createTarefa.mutateAsync({ pep_entry_id: entryId, ...form, responsavel: form.responsavel || null, notas: form.notas || null })
        toast.success('Tarefa criada')
      }
      setShowForm(false)
    } catch { toast.error('Erro ao salvar tarefa') }
  }

  const handleDelete = async (t: PepTarefa) => {
    try {
      await deleteTarefa.mutateAsync({ id: t.id, pep_entry_id: entryId })
      toast.success('Tarefa excluída')
    } catch { toast.error('Erro ao excluir') }
  }

  // Group by fase
  const grouped = useMemo(() => {
    const groups: Record<string, PepTarefa[]> = {}
    for (const t of tarefas) {
      if (!groups[t.fase]) groups[t.fase] = []
      groups[t.fase].push(t)
    }
    return groups
  }, [tarefas])

  // Financial chart
  const maxFinVal = useMemo(() => Math.max(1, ...cronograma.map(c => Math.max(c.valor_planejado, c.valor_realizado))), [cronograma])

  return (
    <div className="space-y-6">
      {/* Gantt Chart */}
      <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <CalendarDays className="w-3.5 h-3.5 text-primary" />
              </div>
              Cronograma Físico-Financeiro
            </CardTitle>
            <Button variant="outline" size="sm" className="rounded-lg text-xs h-7" onClick={openCreate}>
              <Plus className="w-3 h-3 mr-1" />Nova Tarefa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(FASE_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cfg.color }} />
                <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
              </div>
            ))}
          </div>

          {tarefas.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhuma tarefa cadastrada. Clique em "Nova Tarefa" para começar.</p>
          ) : (
            <div className="overflow-x-auto">
              {/* Month headers */}
              <div className="relative min-w-[700px]">
                <div className="flex border-b border-border/50 mb-1">
                  <div className="w-[200px] flex-shrink-0" />
                  <div className="flex-1 relative h-6">
                    {months.map((m, i) => {
                      const left = getPosition(m.toISOString().slice(0, 10))
                      const nextMonth = i < months.length - 1 ? getPosition(months[i + 1].toISOString().slice(0, 10)) : 100
                      const width = nextMonth - left
                      return (
                        <div
                          key={i}
                          className="absolute top-0 text-[9px] text-muted-foreground text-center border-l border-border/30"
                          style={{ left: `${left}%`, width: `${width}%` }}
                        >
                          {m.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tasks */}
                <TooltipProvider delayDuration={200}>
                  {Object.entries(FASE_CONFIG).map(([faseKey, faseCfg]) => {
                    const tasks = grouped[faseKey]
                    if (!tasks || tasks.length === 0) return null
                    return (
                      <div key={faseKey}>
                        {tasks.map(t => {
                          const left = getPosition(t.data_inicio)
                          const right = getPosition(t.data_fim)
                          const width = Math.max(1, right - left)
                          const statusCfg = STATUS_TAREFA[t.status] ?? STATUS_TAREFA.pendente
                          return (
                            <div key={t.id} className="flex items-center group h-8 hover:bg-muted/20 rounded transition-colors">
                              <div className="w-[200px] flex-shrink-0 flex items-center gap-1.5 pr-2">
                                <span className="text-[10px] truncate text-foreground flex-1">{t.titulo}</span>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEdit(t)} className="p-0.5 hover:bg-muted rounded">
                                    <Pencil className="w-3 h-3 text-muted-foreground" />
                                  </button>
                                  <button onClick={() => handleDelete(t)} className="p-0.5 hover:bg-destructive/10 rounded">
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1 relative h-6">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="absolute top-1 h-4 rounded-full cursor-pointer transition-all hover:h-5 hover:top-0.5"
                                      style={{
                                        left: `${left}%`,
                                        width: `${width}%`,
                                        backgroundColor: faseCfg.color,
                                        opacity: t.status === 'concluida' ? 0.7 : 0.9,
                                      }}
                                    >
                                      {/* Progress fill */}
                                      {t.progresso > 0 && (
                                        <div
                                          className="h-full rounded-full"
                                          style={{
                                            width: `${t.progresso}%`,
                                            backgroundColor: 'rgba(255,255,255,0.3)',
                                          }}
                                        />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <div className="space-y-1">
                                      <p className="font-semibold text-xs">{t.titulo}</p>
                                      <p className="text-[10px]">{faseCfg.label} · <Badge className={cn('text-[9px] h-3.5 px-1 rounded-full', statusCfg.color)}>{statusCfg.label}</Badge></p>
                                      <p className="text-[10px]">{new Date(t.data_inicio).toLocaleDateString('pt-BR')} — {new Date(t.data_fim).toLocaleDateString('pt-BR')}</p>
                                      <p className="text-[10px]">Progresso: {t.progresso}%</p>
                                      {t.responsavel && <p className="text-[10px]">Responsável: {t.responsavel}</p>}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </TooltipProvider>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Chart */}
      {cronograma.length > 0 && (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Desembolso Mensal (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1 min-w-[600px] h-40">
                {cronograma.map(c => {
                  const hPlan = (c.valor_planejado / maxFinVal) * 100
                  const hReal = (c.valor_realizado / maxFinVal) * 100
                  const month = new Date(c.periodo).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
                  return (
                    <TooltipProvider key={c.id} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1 flex flex-col items-center gap-0.5">
                            <div className="w-full flex gap-[1px] items-end justify-center" style={{ height: '120px' }}>
                              <div className="w-[45%] rounded-t-sm bg-primary/30" style={{ height: `${hPlan}%` }} />
                              <div className="w-[45%] rounded-t-sm bg-primary" style={{ height: `${hReal}%` }} />
                            </div>
                            <span className="text-[8px] text-muted-foreground -rotate-45 origin-top-left whitespace-nowrap">{month}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs font-medium">{month}</p>
                          <p className="text-[10px]">Planejado: {fUSD(c.valor_planejado)}</p>
                          <p className="text-[10px]">Realizado: {fUSD(c.valor_realizado)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 justify-center">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-primary/30" /><span className="text-[10px] text-muted-foreground">Planejado</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-primary" /><span className="text-[10px] text-muted-foreground">Realizado</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Título *</label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="mt-1 rounded-lg" placeholder="Ex: Elaboração do TR" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Fase</label>
                <Select value={form.fase} onValueChange={v => setForm(f => ({ ...f, fase: v }))}>
                  <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FASE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                          {v.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_TAREFA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data Início *</label>
                <Input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} className="mt-1 rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data Fim *</label>
                <Input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} className="mt-1 rounded-lg" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Progresso: {form.progresso}%</label>
              <Slider value={[form.progresso]} onValueChange={([v]) => setForm(f => ({ ...f, progresso: v }))} max={100} step={5} className="mt-2" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Responsável</label>
              <Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} className="mt-1 rounded-lg" placeholder="Ex: UGP, SMAMUS" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notas</label>
              <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} className="mt-1 rounded-lg" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button className="rounded-lg" onClick={handleSave} disabled={createTarefa.isPending || updateTarefa.isPending}>
              <Save className="w-4 h-4 mr-1" />{editId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
