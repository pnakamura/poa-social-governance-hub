import { useState } from 'react'
import { Plus, MessageSquareWarning } from 'lucide-react'
import { useNotasCriticas, useRecomendacoes, useCreateNota, useCreateRecomendacao } from '@/lib/queries/misc'
import { type NotaCritica, type Recomendacao } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UrgencyBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const COMPONENTES = [
  'C1 — Interoperabilidade',
  'C2 — Reabilitação Urbana',
  'C3 — Administração',
  'Transversal',
]

export default function Analysis() {
  const { data: notas = [], isLoading: notasLoading } = useNotasCriticas()
  const { data: recs = [], isLoading: recsLoading } = useRecomendacoes()
  const createNota = useCreateNota()
  const createRec = useCreateRecomendacao()

  const [notaDialog, setNotaDialog] = useState(false)
  const [recDialog, setRecDialog] = useState(false)
  const [notaForm, setNotaForm] = useState<Partial<NotaCritica>>({ autor: 'Paulo Nakamura' })
  const [recForm, setRecForm] = useState<Partial<Recomendacao>>({ urgencia: 'Media', status: 'Pendente' })

  const handleSaveNota = async () => {
    if (!notaForm.nota) return
    await createNota.mutateAsync(notaForm as Omit<NotaCritica, 'id' | 'criado_em'>)
    setNotaDialog(false)
    setNotaForm({ autor: 'Paulo Nakamura' })
  }

  const handleSaveRec = async () => {
    if (!recForm.titulo) return
    await createRec.mutateAsync(recForm as Omit<Recomendacao, 'id' | 'criado_em'>)
    setRecDialog(false)
    setRecForm({ urgencia: 'Media', status: 'Pendente' })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Análise Crítica</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Notas de acompanhamento e recomendações estratégicas</p>
      </div>

      <Tabs defaultValue="notas">
        <TabsList>
          <TabsTrigger value="notas">Notas Críticas ({notas.length})</TabsTrigger>
          <TabsTrigger value="recomendacoes">Recomendações ({recs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="notas" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button onClick={() => setNotaDialog(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />Nova Nota
            </Button>
          </div>
          {notasLoading ? (
            <div className="space-y-2 animate-pulse">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded" />)}</div>
          ) : notas.length === 0 ? (
            <EmptyState icon={MessageSquareWarning} title="Nenhuma nota crítica" description="Registre observações sobre o andamento do programa." />
          ) : (
            <div className="space-y-3">
              {notas.map(nota => (
                <Card key={nota.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {nota.componente && (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded mb-2 inline-block">
                          {nota.componente}
                        </span>
                      )}
                      <p className="text-sm leading-relaxed">{nota.nota}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-foreground">{nota.autor ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(nota.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recomendacoes" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button onClick={() => setRecDialog(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />Nova Recomendação
            </Button>
          </div>
          {recsLoading ? (
            <div className="space-y-2 animate-pulse">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded" />)}</div>
          ) : recs.length === 0 ? (
            <EmptyState icon={MessageSquareWarning} title="Nenhuma recomendação" description="Registre recomendações de ação para o programa." />
          ) : (
            <div className="space-y-3">
              {recs.map(rec => (
                <Card key={rec.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium">{rec.titulo}</p>
                        <UrgencyBadge urgencia={rec.urgencia} />
                        {rec.componente && (
                          <span className="text-xs text-muted-foreground">{rec.componente}</span>
                        )}
                      </div>
                      {rec.descricao && <p className="text-sm text-muted-foreground">{rec.descricao}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {rec.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Nota dialog */}
      <Dialog open={notaDialog} onOpenChange={setNotaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Nota Crítica</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Componente</Label>
              <Select value={notaForm.componente ?? ''} onValueChange={v => setNotaForm(p => ({ ...p, componente: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>{COMPONENTES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nota</Label>
              <Textarea rows={4} value={notaForm.nota ?? ''} onChange={e => setNotaForm(p => ({ ...p, nota: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Autor</Label>
              <Input value={notaForm.autor ?? ''} onChange={e => setNotaForm(p => ({ ...p, autor: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotaDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveNota} disabled={createNota.isPending}>{createNota.isPending ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recomendação dialog */}
      <Dialog open={recDialog} onOpenChange={setRecDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Recomendação</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Título</Label>
              <Input value={recForm.titulo ?? ''} onChange={e => setRecForm(p => ({ ...p, titulo: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} value={recForm.descricao ?? ''} onChange={e => setRecForm(p => ({ ...p, descricao: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Urgência</Label>
                <Select value={recForm.urgencia} onValueChange={v => setRecForm(p => ({ ...p, urgencia: v as Recomendacao['urgencia'] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Alta', 'Media', 'Baixa'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Componente</Label>
                <Select value={recForm.componente ?? ''} onValueChange={v => setRecForm(p => ({ ...p, componente: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>{COMPONENTES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveRec} disabled={createRec.isPending}>{createRec.isPending ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
