import { useState } from 'react'
import { Plus, ListChecks } from 'lucide-react'
import { useAtividades, useUpdateAtividadeStatus, useCreateAtividade, useDeleteAtividade } from '@/lib/queries/activities'
import { type Atividade } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatusBadge, UrgencyBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const COLUMNS: { key: Atividade['status']; label: string; color: string }[] = [
  { key: 'todo',     label: 'A Fazer',    color: 'bg-muted' },
  { key: 'progress', label: 'Em Andamento', color: 'bg-accent/10' },
  { key: 'waiting',  label: 'Aguardando', color: 'bg-yellow-50' },
  { key: 'done',     label: 'Concluído',  color: 'bg-green-50' },
]

const PRIORIDADE_COLOR: Record<string, string> = {
  Alta:  'bg-red-100 text-red-700',
  Media: 'bg-yellow-100 text-yellow-700',
  Baixa: 'bg-green-100 text-green-700',
}

export default function Activities() {
  const { data: atividades = [], isLoading } = useAtividades()
  const updateStatus = useUpdateAtividadeStatus()
  const createAtv = useCreateAtividade()
  const deleteAtv = useDeleteAtividade()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [newAtv, setNewAtv] = useState<Partial<Atividade>>({
    prioridade: 'Media', status: 'todo', progresso: 0,
  })

  const handleSave = async () => {
    if (!newAtv.titulo) return
    await createAtv.mutateAsync(newAtv as Omit<Atividade, 'id' | 'criado_em' | 'atualizado_em'>)
    setDialogOpen(false)
    setNewAtv({ prioridade: 'Media', status: 'todo', progresso: 0 })
  }

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Atividades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Painel Kanban de acompanhamento de tarefas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Atividade
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-8 bg-muted rounded" />
              {[...Array(3)].map((_, j) => <div key={j} className="h-20 bg-muted rounded" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const items = atividades.filter(a => a.status === col.key)
            return (
              <div key={col.key} className="flex flex-col gap-2">
                <div className={cn('rounded-lg px-3 py-2 flex items-center justify-between', col.color)}>
                  <span className="text-sm font-medium">{col.label}</span>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>

                {items.length === 0 ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground">Sem atividades</p>
                  </div>
                ) : (
                  items.map(atv => {
                    const atrasado = atv.prazo && atv.prazo < hoje && atv.status !== 'done'
                    return (
                      <Card key={atv.id} className={cn('p-3 hover:shadow-sm transition-shadow', atrasado && 'border-red-200 bg-red-50/40')}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium leading-tight line-clamp-2">{atv.titulo}</p>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0', PRIORIDADE_COLOR[atv.prioridade])}>
                            {atv.prioridade}
                          </span>
                        </div>

                        {atv.componente && (
                          <p className="text-xs text-muted-foreground mb-1">{atv.componente}</p>
                        )}

                        {atv.progresso > 0 && (
                          <div className="mb-2">
                            <Progress value={atv.progresso} className="h-1.5" />
                            <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{atv.progresso}%</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-2">
                            {atv.responsavel && (
                              <span className="text-xs text-muted-foreground truncate max-w-[80px]">{atv.responsavel}</span>
                            )}
                            {atv.prazo && (
                              <span className={cn('text-xs tabular-nums', atrasado ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                                {new Date(atv.prazo + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                          <Select
                            value={atv.status}
                            onValueChange={v => updateStatus.mutate({ id: atv.id, status: v as Atividade['status'] })}
                          >
                            <SelectTrigger className="h-6 w-auto text-[10px] border-0 p-0 shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COLUMNS.map(c => <SelectItem key={c.key} value={c.key} className="text-xs">{c.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Atividade</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Título</Label>
              <Input value={newAtv.titulo ?? ''} onChange={e => setNewAtv(p => ({ ...p, titulo: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Componente</Label>
                <Input value={newAtv.componente ?? ''} onChange={e => setNewAtv(p => ({ ...p, componente: e.target.value }))} className="mt-1" placeholder="Ex: C2 — Reabilitação" />
              </div>
              <div>
                <Label>Responsável</Label>
                <Input value={newAtv.responsavel ?? ''} onChange={e => setNewAtv(p => ({ ...p, responsavel: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prazo</Label>
                <Input type="date" value={newAtv.prazo ?? ''} onChange={e => setNewAtv(p => ({ ...p, prazo: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={newAtv.prioridade} onValueChange={v => setNewAtv(p => ({ ...p, prioridade: v as Atividade['prioridade'] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Alta', 'Media', 'Baixa'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createAtv.isPending}>{createAtv.isPending ? 'Salvando...' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
