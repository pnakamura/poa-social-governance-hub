import { useState } from 'react'
import { AlertTriangle, Filter, User, Clock } from 'lucide-react'
import { HelpTooltip } from '@/components/HelpTooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { usePontosAtencao } from '@/hooks/usePontosAtencao'
import type { PontoAtencao } from '@/lib/supabase'

const CRIT_CONFIG: Record<PontoAtencao['criticidade'], { label: string; badge: string; bg: string; icon: string }> = {
  critico: { label: 'Crítico',  badge: 'bg-red-100 text-red-800 border-red-200',    bg: 'border-l-red-500',    icon: '🔴' },
  alerta:  { label: 'Alerta',   badge: 'bg-amber-100 text-amber-800 border-amber-200', bg: 'border-l-amber-500', icon: '🟡' },
  ok:      { label: 'OK',       badge: 'bg-green-100 text-green-800 border-green-200', bg: 'border-l-green-500', icon: '🟢' },
  info:    { label: 'Info',     badge: 'bg-blue-100 text-blue-800 border-blue-200',  bg: 'border-l-blue-500',  icon: '🔵' },
}

const AREA_LABELS: Record<string, string> = {
  obras:         'Obras',
  digital:       'Digital',
  social:        'Social',
  governanca:    'Governança',
  juridico:      'Jurídico',
  socioambiental:'Socioambiental',
  aquisicoes:    'Aquisições',
  financeiro:    'Financeiro',
}

export default function PontosAtencao() {
  const [filtroArea, setFiltroArea] = useState('todos')
  const [filtroCrit, setFiltroCrit] = useState('todos')
  const { data: pontos = [], isLoading } = usePontosAtencao()

  const filtrados = pontos.filter(p => {
    if (filtroArea !== 'todos' && p.area !== filtroArea) return false
    if (filtroCrit !== 'todos' && p.criticidade !== filtroCrit) return false
    return true
  })

  const criticos = pontos.filter(p => p.criticidade === 'critico').length
  const alertas  = pontos.filter(p => p.criticidade === 'alerta').length
  const oks      = pontos.filter(p => p.criticidade === 'ok').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="gradient-bid rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Pontos de Atenção</h1>
            <HelpTooltip id="pontos-atencao-semaforo" />
          </div>
        </div>
        <p className="text-white/70 text-sm mb-4">Semáforo institucional de riscos e pendências do programa BR-L1597</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Críticos', value: criticos, color: 'bg-red-500/30', icon: '🔴' },
            { label: 'Alertas',  value: alertas,  color: 'bg-amber-500/30', icon: '🟡' },
            { label: 'OK',       value: oks,       color: 'bg-green-500/30', icon: '🟢' },
          ].map(item => (
            <div key={item.label} className={`${item.color} rounded-lg p-3 text-center`}>
              <p className="text-xl">{item.icon}</p>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-white/70 text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filtroArea} onValueChange={setFiltroArea}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as áreas</SelectItem>
            {Object.entries(AREA_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroCrit} onValueChange={setFiltroCrit}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Criticidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {Object.entries(CRIT_CONFIG).map(([v, c]) => (
              <SelectItem key={v} value={v}>{c.icon} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtrados.length} de {pontos.length} itens</span>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum ponto encontrado.</div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(ponto => {
            const cc = CRIT_CONFIG[ponto.criticidade]
            return (
              <Card key={ponto.id} className={`border-l-4 ${cc.bg}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{cc.icon}</span>
                        <p className="font-medium text-sm">{ponto.tema}</p>
                      </div>
                      {ponto.descricao && (
                        <p className="text-xs text-muted-foreground">{ponto.descricao}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        {ponto.responsavel && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {ponto.responsavel}
                          </span>
                        )}
                        {ponto.prazo_previsto && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Prazo: {new Date(ponto.prazo_previsto + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="outline" className={`text-xs ${cc.badge}`}>{cc.label}</Badge>
                      <Badge variant="secondary" className="text-xs">{AREA_LABELS[ponto.area] ?? ponto.area}</Badge>
                      {ponto.status_texto && (
                        <span className="text-[10px] text-muted-foreground">{ponto.status_texto}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
