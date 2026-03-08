import { useState } from 'react'
import { Plus, CheckSquare } from 'lucide-react'
import { useNaoObjecoes, useCreateNaoObjecao } from '@/lib/queries/misc'
import { type NaoObjecao } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<string, string> = {
  Pendente:  'bg-yellow-100 text-yellow-700',
  Recebida:  'bg-green-100 text-green-700',
  Vencida:   'bg-red-100 text-red-700',
  Cancelada: 'bg-gray-100 text-gray-500',
}

const USD = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

export default function NoObjections() {
  const { data: nobs = [], isLoading } = useNaoObjecoes()
  const createNob = useCreateNaoObjecao()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<Partial<NaoObjecao>>({ status: 'Pendente', tipo: 'Aquisição' })

  const grouped = nobs.reduce<Record<string, NaoObjecao[]>>((acc, n) => {
    const key = n.status
    acc[key] = [...(acc[key] ?? []), n]
    return acc
  }, {})

  const handleSave = async () => {
    if (!form.processo) return
    await createNob.mutateAsync(form as Omit<NaoObjecao, 'id' | 'criado_em'>)
    setDialogOpen(false)
    setForm({ status: 'Pendente', tipo: 'Aquisição' })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Não-Objeções BID</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Processos de aquisição e aprovações formais</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Processo
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pendentes', key: 'Pendente', color: 'border-l-yellow-400' },
          { label: 'Recebidas', key: 'Recebida', color: 'border-l-green-500' },
          { label: 'Vencidas', key: 'Vencida', color: 'border-l-red-500' },
          { label: 'Total', key: '_all', color: 'border-l-primary' },
        ].map(item => (
          <Card key={item.label} className={cn('p-4 border-l-4', item.color)}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {item.key === '_all' ? nobs.length : (grouped[item.key]?.length ?? 0)}
            </p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted rounded" />)}</div>
          ) : nobs.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={CheckSquare} title="Nenhum processo cadastrado" description="Cadastre não-objeções e processos BID para acompanhamento." />
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="gradient-bid text-white text-xs">
                    <th className="text-left px-4 py-3">Processo</th>
                    <th className="text-left px-4 py-3 w-28">Tipo</th>
                    <th className="text-left px-4 py-3 w-28">Solicitado</th>
                    <th className="text-left px-4 py-3 w-28">Recebido</th>
                    <th className="text-right px-4 py-3 w-28">Valor (US$)</th>
                    <th className="text-center px-4 py-3 w-28">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nobs.map(n => (
                    <tr key={n.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">{n.processo}</p>
                        {n.observacoes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.observacoes}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{n.tipo ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {n.solicitado_em ? new Date(n.solicitado_em + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {n.recebido_em ? new Date(n.recebido_em + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {n.valor_usd ? USD(n.valor_usd) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-xs px-2 py-0.5 rounded font-medium', STATUS_COLOR[n.status])}>
                          {n.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Processo / Não-Objeção</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Nome do processo</Label>
              <Input value={form.processo ?? ''} onChange={e => setForm(p => ({ ...p, processo: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo ?? 'Aquisição'} onValueChange={v => setForm(p => ({ ...p, tipo: v as NaoObjecao['tipo'] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Aquisição', 'Pessoal', 'Consultoria', 'TdR', 'Outro'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (US$)</Label>
                <Input type="number" value={form.valor_usd ?? ''} onChange={e => setForm(p => ({ ...p, valor_usd: Number(e.target.value) }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data solicitação</Label>
                <Input type="date" value={form.solicitado_em ?? ''} onChange={e => setForm(p => ({ ...p, solicitado_em: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Data recebimento</Label>
                <Input type="date" value={form.recebido_em ?? ''} onChange={e => setForm(p => ({ ...p, recebido_em: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes ?? ''} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createNob.isPending}>{createNob.isPending ? 'Salvando...' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
