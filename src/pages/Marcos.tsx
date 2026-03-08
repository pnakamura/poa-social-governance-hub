import { useState } from 'react'
import { Calendar, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useMarcos } from '@/hooks/useMarcos'
import type { Marco } from '@/lib/supabase'

const STATUS_CONFIG: Record<Marco['status'], { label: string; color: string; dot: string }> = {
  concluido:    { label: 'Concluído',    color: 'bg-green-100 text-green-800 border-green-200',  dot: 'bg-green-500' },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-100 text-blue-800 border-blue-200',     dot: 'bg-blue-500' },
  previsto:     { label: 'Previsto',     color: 'bg-gray-100 text-gray-600 border-gray-200',     dot: 'bg-gray-400' },
  atrasado:     { label: 'Atrasado',     color: 'bg-red-100 text-red-800 border-red-200',        dot: 'bg-red-500' },
}

const TIPO_LABELS: Record<Marco['tipo'], string> = {
  legislativo:  'Legislativo',
  contratual:   'Contratual',
  missao_bid:   'Missão BID',
  entrega_doc:  'Entrega Doc.',
  obra:         'Obra',
  aquisicao:    'Aquisição',
  outro:        'Outro',
}

const AREA_LABELS: Record<string, string> = {
  obras:         'Obras',
  digital:       'Digital',
  social:        'Social',
  governanca:    'Governança',
  financeiro:    'Financeiro',
  aquisicoes:    'Aquisições',
  socioambiental:'Socioambiental',
}

function formatarSemestre(data: string) {
  const d = new Date(data + 'T00:00:00')
  const ano = d.getFullYear()
  const sem = d.getMonth() < 6 ? '1º Sem.' : '2º Sem.'
  return `${sem} ${ano}`
}

function agruparPorSemestre(marcos: Marco[]) {
  const grupos: Record<string, Marco[]> = {}
  for (const m of marcos) {
    const chave = formatarSemestre(m.data_marco)
    if (!grupos[chave]) grupos[chave] = []
    grupos[chave].push(m)
  }
  return Object.entries(grupos)
}

export default function Marcos() {
  const [filtroArea, setFiltroArea] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')

  const { data: marcos = [], isLoading } = useMarcos({
    area: filtroArea !== 'todos' ? filtroArea : undefined,
    status: filtroStatus !== 'todos' ? filtroStatus : undefined,
  })

  const grupos = agruparPorSemestre(marcos)

  const concluidos   = marcos.filter(m => m.status === 'concluido').length
  const emAndamento  = marcos.filter(m => m.status === 'em_andamento').length
  const previstos    = marcos.filter(m => m.status === 'previsto').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="gradient-bid rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Timeline do Programa</h1>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Concluídos', value: concluidos, color: 'bg-green-500/30' },
            { label: 'Em andamento', value: emAndamento, color: 'bg-blue-500/30' },
            { label: 'Previstos', value: previstos, color: 'bg-white/10' },
          ].map(item => (
            <div key={item.label} className={`${item.color} rounded-lg p-3 text-center`}>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-white/70 text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground self-center" />
        <Select value={filtroArea} onValueChange={setFiltroArea}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as áreas</SelectItem>
            {Object.entries(AREA_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <SelectItem key={v} value={v}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : marcos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum marco encontrado.</div>
      ) : (
        <div className="space-y-8">
          {grupos.map(([semestre, itens]) => (
            <div key={semestre}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {semestre}
              </h2>
              <div className="relative pl-5 border-l-2 border-border/60 space-y-4">
                {itens.map(marco => {
                  const sc = STATUS_CONFIG[marco.status]
                  return (
                    <div key={marco.id} className="relative">
                      {/* Dot */}
                      <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 border-background ${sc.dot}`} />
                      <Card className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{marco.titulo}</p>
                              {marco.descricao && (
                                <p className="text-xs text-muted-foreground mt-1">{marco.descricao}</p>
                              )}
                              {marco.referencia_doc && (
                                <p className="text-xs text-primary mt-1">Ref: {marco.referencia_doc}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <Badge variant="outline" className={`text-xs ${sc.color}`}>
                                {sc.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(marco.data_marco + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                              {TIPO_LABELS[marco.tipo]}
                            </Badge>
                            {marco.area && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                {AREA_LABELS[marco.area] ?? marco.area}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
