import { useState } from 'react'
import { ShoppingCart, Filter, DollarSign } from 'lucide-react'
import { HelpTooltip } from '@/components/HelpTooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAquisicoes } from '@/hooks/useAquisicoes'
import type { Aquisicao } from '@/lib/supabase'

const STATUS_CONFIG: Record<Aquisicao['status'], { label: string; color: string }> = {
  planejado:    { label: 'Planejado',     color: 'bg-gray-100 text-gray-600 border-gray-200' },
  preparacao:   { label: 'Preparação',    color: 'bg-blue-100 text-blue-800 border-blue-200' },
  publicado:    { label: 'Publicado',     color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  em_avaliacao: { label: 'Em avaliação',  color: 'bg-purple-100 text-purple-800 border-purple-200' },
  adjudicado:   { label: 'Adjudicado',    color: 'bg-amber-100 text-amber-800 border-amber-200' },
  contratado:   { label: 'Contratado',    color: 'bg-orange-100 text-orange-800 border-orange-200' },
  em_execucao:  { label: 'Em execução',   color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  concluido:    { label: 'Concluído',     color: 'bg-green-100 text-green-800 border-green-200' },
  cancelado:    { label: 'Cancelado',     color: 'bg-red-100 text-red-800 border-red-200' },
}

const TIPO_LABELS: Record<Aquisicao['tipo'], string> = {
  obra:        'Obra',
  consultoria: 'Consultoria',
  bem:         'Bem',
  servico:     'Serviço',
  fidic:       'FIDIC',
}

const SECRETARIAS = ['SMPG', 'SMS', 'SMAS', 'SMED', 'SMID', 'SMDET', 'PROCEMPA', 'DEMHAB', 'Outro']

const USD = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

export default function Aquisicoes() {
  const [filtroSecretaria, setFiltroSecretaria] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')

  const { data: aquisicoes = [], isLoading } = useAquisicoes({
    secretaria: filtroSecretaria !== 'todos' ? filtroSecretaria : undefined,
    tipo: filtroTipo !== 'todos' ? filtroTipo : undefined,
    status: filtroStatus !== 'todos' ? filtroStatus : undefined,
  })

  const totalUSD = aquisicoes.reduce((s, a) => s + (a.valor_usd ?? 0), 0)
  const comFIDIC = aquisicoes.filter(a => a.fidic_aplicavel).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="gradient-bid rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingCart className="w-6 h-6" />
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Plano de Aquisições</h1>
            <HelpTooltip id="plano-aquisicoes" />
          </div>
        </div>
        <p className="text-white/70 text-sm mb-4">Processos licitatórios do programa BR-L1597</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total processos', value: String(aquisicoes.length) },
            { label: 'Valor total (USD)', value: totalUSD > 0 ? USD(totalUSD) : '—' },
            { label: 'Com FIDIC', value: String(comFIDIC) },
            { label: 'Filtrado', value: String(aquisicoes.length) },
          ].map(item => (
            <div key={item.label} className="bg-white/10 rounded-lg p-3">
              <p className="text-white/60 text-xs">{item.label}</p>
              <p className="text-white font-semibold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filtroSecretaria} onValueChange={setFiltroSecretaria}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Secretaria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {SECRETARIAS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos tipos</SelectItem>
            {Object.entries(TIPO_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <SelectItem key={v} value={v}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : aquisicoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma aquisição cadastrada ainda.
            <p className="text-xs mt-1">Os processos serão importados via n8n + Google Sheets.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {aquisicoes.map(aq => {
            const sc = STATUS_CONFIG[aq.status]
            return (
              <Card key={aq.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{aq.titulo}</p>
                      {aq.id_processo && (
                        <p className="text-xs text-muted-foreground">{aq.id_processo}</p>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {TIPO_LABELS[aq.tipo]}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {aq.secretaria}
                        </Badge>
                        {aq.componente && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {aq.componente}
                          </Badge>
                        )}
                        {aq.fidic_aplicavel && (
                          <Badge className="text-[10px] h-4 px-1.5 bg-orange-100 text-orange-800 border-orange-200">
                            FIDIC
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="outline" className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                      {aq.valor_usd != null && (
                        <span className="text-xs font-medium flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />{USD(aq.valor_usd)}
                        </span>
                      )}
                      {aq.data_inicio_previsto && (
                        <span className="text-[10px] text-muted-foreground">
                          Prev: {new Date(aq.data_inicio_previsto + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
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
