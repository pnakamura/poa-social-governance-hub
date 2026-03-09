import { useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { HelpTooltip } from '@/components/HelpTooltip'
import { useRiscos, useCreateRisco, useUpdateRisco, useDeleteRisco } from '@/lib/queries/risks'
import { type Risco } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RiscoNivelBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const CATEGORIAS = ['Financeiro', 'Político', 'Técnico', 'Ambiental', 'Social', 'Institucional'] as const
const NIVEIS = [1, 2, 3, 4, 5]

const MATRIX_COLORS = (nivel: number) => {
  if (nivel >= 16) return 'bg-risk-critical/70 text-white'
  if (nivel >= 10) return 'bg-risk-high/70 text-white'
  if (nivel >= 5)  return 'bg-risk-medium/80'
  if (nivel >= 2)  return 'bg-risk-low/70'
  return 'bg-risk-minimal/60'
}

export default function Risks() {
  const { data: riscos = [], isLoading } = useRiscos()
  const createRisco = useCreateRisco()
  const updateRisco = useUpdateRisco()
  const deleteRisco = useDeleteRisco()

  const [selectedCell, setSelectedCell] = useState<{ prob: number; imp: number } | null>(null)
  const [editingRisco, setEditingRisco] = useState<Partial<Risco> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const openNew = () => {
    setEditingRisco({ probabilidade: 3, impacto: 3, categoria: 'Financeiro', status: 'Ativo' })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingRisco?.descricao || !editingRisco?.probabilidade || !editingRisco?.impacto) return
    if (editingRisco.id) {
      await updateRisco.mutateAsync(editingRisco as Risco)
    } else {
      await createRisco.mutateAsync(editingRisco as Omit<Risco, 'id' | 'nivel' | 'criado_em' | 'atualizado_em'>)
    }
    setDialogOpen(false)
  }

  const filteredRiscos = selectedCell
    ? riscos.filter(r => r.probabilidade === selectedCell.prob && r.impacto === selectedCell.imp)
    : riscos

  // Build matrix data
  const matrixCount = (prob: number, imp: number) =>
    riscos.filter(r => r.probabilidade === prob && r.impacto === imp && r.status === 'Ativo').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Matriz de Riscos</h1>
            <HelpTooltip id="matriz-riscos" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Registro e monitoramento de riscos do programa</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Risco
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Matrix */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mapa de Calor (5×5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex gap-1 mb-2">
                <div className="w-16 text-xs text-muted-foreground text-right pr-2 self-end pb-1">Prob→</div>
                {NIVEIS.map(p => (
                  <div key={p} className="flex-1 text-center text-xs font-medium text-muted-foreground">{p}</div>
                ))}
              </div>
              {[...NIVEIS].reverse().map(imp => (
                <div key={imp} className="flex gap-1 items-center">
                  <div className="w-16 text-xs text-muted-foreground text-right pr-2">{imp}</div>
                  {NIVEIS.map(prob => {
                    const nivel = prob * imp
                    const count = matrixCount(prob, imp)
                    const isSelected = selectedCell?.prob === prob && selectedCell?.imp === imp
                    return (
                      <button
                        key={prob}
                        onClick={() => setSelectedCell(isSelected ? null : { prob, imp })}
                        className={cn(
                          'flex-1 aspect-square rounded risk-cell flex items-center justify-center text-xs font-medium',
                          MATRIX_COLORS(nivel),
                          isSelected && 'ring-2 ring-primary ring-offset-1'
                        )}
                      >
                        {count > 0 ? count : ''}
                      </button>
                    )
                  })}
                </div>
              ))}
              <div className="text-[10px] text-muted-foreground text-center mt-2">← Impacto</div>
            </div>
          </CardContent>
        </Card>

        {/* Registry */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex-row justify-between items-center">
            <CardTitle className="text-sm">
              Registro de Riscos
              {selectedCell && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (P={selectedCell.prob} × I={selectedCell.imp})
                </span>
              )}
            </CardTitle>
            {selectedCell && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedCell(null)} className="text-xs h-7">
                Limpar filtro
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2 animate-pulse">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}
              </div>
            ) : filteredRiscos.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={AlertTriangle} title="Nenhum risco" description="Clique em 'Novo Risco' para cadastrar." />
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredRiscos.map(risco => (
                  <div key={risco.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <RiscoNivelBadge nivel={risco.nivel} />
                        <Badge variant="outline" className="text-xs">{risco.categoria}</Badge>
                        {risco.responsavel && (
                          <span className="text-xs text-muted-foreground">{risco.responsavel}</span>
                        )}
                      </div>
                      <p className="text-sm">{risco.descricao}</p>
                      {risco.mitigacao && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          <span className="font-medium">Mitigação:</span> {risco.mitigacao}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditingRisco(risco); setDialogOpen(true) }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => deleteRisco.mutate(risco.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRisco?.id ? 'Editar Risco' : 'Novo Risco'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={editingRisco?.descricao ?? ''}
                onChange={e => setEditingRisco(prev => ({ ...prev, descricao: e.target.value }))}
                rows={2}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={editingRisco?.categoria}
                  onValueChange={v => setEditingRisco(prev => ({ ...prev, categoria: v as Risco['categoria'] }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editingRisco?.status}
                  onValueChange={v => setEditingRisco(prev => ({ ...prev, status: v as Risco['status'] }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Ativo', 'Mitigado', 'Monitorando', 'Fechado'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Probabilidade (1–5)</Label>
                <Select
                  value={String(editingRisco?.probabilidade ?? 3)}
                  onValueChange={v => setEditingRisco(prev => ({ ...prev, probabilidade: Number(v) }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{NIVEIS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Impacto (1–5)</Label>
                <Select
                  value={String(editingRisco?.impacto ?? 3)}
                  onValueChange={v => setEditingRisco(prev => ({ ...prev, impacto: Number(v) }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{NIVEIS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Responsável</Label>
              <Input
                value={editingRisco?.responsavel ?? ''}
                onChange={e => setEditingRisco(prev => ({ ...prev, responsavel: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Plano de mitigação</Label>
              <Textarea
                value={editingRisco?.mitigacao ?? ''}
                onChange={e => setEditingRisco(prev => ({ ...prev, mitigacao: e.target.value }))}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createRisco.isPending || updateRisco.isPending}>
              {createRisco.isPending || updateRisco.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
