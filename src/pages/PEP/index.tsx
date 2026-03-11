import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronRight, ChevronDown, Search, X, ExternalLink, DollarSign, Calendar, BarChart3, Activity, RefreshCw, Filter, Building2, Package } from 'lucide-react'
import { usePEPEntries, usePEPVersoes, usePEPCronogramaFisico } from '@/lib/queries/pep'
import { usePMROutputs, usePMROutcomes } from '@/lib/queries/pmr'
import { type PepEntry } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataSourcePanel } from '@/components/DataSourcePanel'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ─── Formatadores ─────────────────────────────────────────────────────────────
const fUSD = (v: number | null | undefined) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—'

const fBRL = (v: number | null | undefined) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) : '—'

const fShort = (v: number, moeda: 'USD' | 'BRL') => {
  const prefix = moeda === 'BRL' ? 'R$' : 'US$'
  if (Math.abs(v) >= 1_000_000) return `${prefix} ${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${prefix} ${(v / 1_000).toFixed(0)}k`
  return moeda === 'BRL' ? fBRL(v) : fUSD(v)
}

const REF_ORDER: Record<string, number> = { C: 0, SC: 1, P: 2, SP: 3, PT: 4 }
const REF_INDENT: Record<string, number> = { C: 0, SC: 0, P: 1, SP: 2, PT: 3 }
const ANOS = ['2025', '2026', '2027', '2028', '2029', 'EOP'] as const
const ANOS_DESEMBOLSO = ['2025', '2026', '2027', '2028', '2029'] as const
const COMP_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const REF_LABELS: Record<string, string> = {
  C: 'Componente',
  SC: 'Subcomponente',
  P: 'Produto',
  SP: 'Subproduto',
  PT: 'Pacote de Trabalho',
}

// ─── Sorting helper: proper hierarchy ─────────────────────────────────────────
function sortHierarchically(entries: PepEntry[]): PepEntry[] {
  return [...entries].sort((a, b) => {
    const compA = a.comp ?? 999
    const compB = b.comp ?? 999
    if (compA !== compB) return compA - compB

    const refA = REF_ORDER[a.ref] ?? 99
    const refB = REF_ORDER[b.ref] ?? 99

    if (a.ref === 'C' && b.ref !== 'C') return -1
    if (b.ref === 'C' && a.ref !== 'C') return 1
    if (a.ref === 'SC' && b.ref !== 'SC' && b.ref !== 'C') return -1
    if (b.ref === 'SC' && a.ref !== 'SC' && a.ref !== 'C') return 1

    const prodA = a.prod ?? 999
    const prodB = b.prod ?? 999
    if (prodA !== prodB) return prodA - prodB

    if (a.ref === 'P' && b.ref !== 'P' && b.ref !== 'C' && b.ref !== 'SC') return -1
    if (b.ref === 'P' && a.ref !== 'P' && a.ref !== 'C' && a.ref !== 'SC') return 1

    const subpA = a.subp ?? 999
    const subpB = b.subp ?? 999
    if (subpA !== subpB) return subpA - subpB

    if (a.ref === 'SP' && b.ref === 'PT') return -1
    if (b.ref === 'SP' && a.ref === 'PT') return 1

    const pctA = a.pct ?? 999
    const pctB = b.pct ?? 999
    if (pctA !== pctB) return pctA - pctB

    return refA - refB
  })
}

// ─── Helper: filter entries by secretaria (keeping parent hierarchy) ──────────
function filterBySecretaria(entries: PepEntry[], secretaria: string): PepEntry[] {
  if (secretaria === 'todos') return entries
  // Find PTs that match the secretaria
  const matchingPTs = entries.filter(e => e.ref === 'PT' && e.secretaria === secretaria)
  // Collect parent keys we need to keep
  const keepComps = new Set(matchingPTs.map(e => e.comp))
  const keepProds = new Set(matchingPTs.map(e => `${e.comp}:${e.prod}`))
  const keepSubps = new Set(matchingPTs.map(e => `${e.comp}:${e.prod}:${e.subp}`))

  return entries.filter(e => {
    if (e.ref === 'PT') return e.secretaria === secretaria
    if (e.ref === 'C' || e.ref === 'SC') return keepComps.has(e.comp)
    if (e.ref === 'P') return keepProds.has(`${e.comp}:${e.prod}`)
    if (e.ref === 'SP') return keepSubps.has(`${e.comp}:${e.prod}:${e.subp}`)
    return false
  })
}

// ─── Delta cell ───────────────────────────────────────────────────────────────
function DeltaCell({ atual, base }: { atual: number; base: number }) {
  if (!base || Math.abs(atual - base) < 0.01) return <span className="text-muted-foreground">—</span>
  const pct = ((atual - base) / base) * 100
  return (
    <span className={cn('text-xs font-medium', pct > 0 ? 'text-red-600' : 'text-green-600')}>
      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

// ─── EntregaCell — ● ou ○ ─────────────────────────────────────────────────────
function EntregaCell({ flag }: { flag: number | null }) {
  return flag ? (
    <span className="text-blue-600 font-bold text-base" title="Entrega prevista">●</span>
  ) : (
    <span className="text-muted-foreground/30 text-base" title="Sem entrega">○</span>
  )
}

// ─── Value accessors by moeda ─────────────────────────────────────────────────
function getValues(r: PepEntry, moeda: 'USD' | 'BRL') {
  return {
    bid:   moeda === 'BRL' ? r.k_reais_bid   : r.n_atual,
    local: moeda === 'BRL' ? r.l_reais_local : r.o_atual,
    total: moeda === 'BRL' ? r.m_reais_total : r.p_atual,
    baseBid:   moeda === 'USD' ? r.r_base : null,
    baseLocal: moeda === 'USD' ? r.s_base : null,
    baseTotal: moeda === 'USD' ? r.t_base : null,
  }
}

// ─── DetailPanel lateral ──────────────────────────────────────────────────────
function DetailPanel({ entry, onClose, moeda }: { entry: PepEntry | null; onClose: () => void; moeda: 'USD' | 'BRL' }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!entry) return null

  const f = moeda === 'BRL' ? fBRL : fUSD
  const vals = getValues(entry, moeda)

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden />
      <aside className="fixed right-0 top-0 h-full w-[420px] max-w-[95vw] bg-background border-l border-border shadow-xl z-50 overflow-y-auto flex flex-col">
        <div className="flex items-start justify-between p-4 border-b sticky top-0 bg-background z-10">
          <div>
            {entry.codigo_wbs && (
              <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mb-1 inline-block">
                WBS {entry.codigo_wbs}
              </span>
            )}
            <h2 className="text-sm font-semibold leading-snug mt-1 pr-6">{entry.descricao}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-5 flex-1">
          {/* Identificação */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Identificação</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="text-muted-foreground">Tipo</div>
              <div><Badge variant="outline" className="text-[10px]">{entry.ref} — {REF_LABELS[entry.ref] ?? entry.ref}</Badge></div>
              {entry.comp != null && <><div className="text-muted-foreground">Componente</div><div>{entry.comp}</div></>}
              {entry.prod != null && <><div className="text-muted-foreground">Produto</div><div>{entry.prod}</div></>}
              {entry.subp != null && <><div className="text-muted-foreground">Subproduto</div><div>{entry.subp}</div></>}
              {entry.pct  != null && <><div className="text-muted-foreground">P. Trabalho</div><div>{entry.pct}</div></>}
              {entry.secretaria && <><div className="text-muted-foreground">Secretaria</div><div>{entry.secretaria}</div></>}
            </div>
          </section>

          {/* Aquisição */}
          {(entry.tipo_aquisicao || entry.metodo_aquisicao || entry.pmr_ref) && (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Aquisição / PMR</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {entry.tipo_aquisicao && (
                  <><div className="text-muted-foreground">Tipo Aquisição</div><div>{entry.tipo_aquisicao}</div></>
                )}
                {entry.metodo_aquisicao && (
                  <><div className="text-muted-foreground">Método BID</div>
                  <div><Badge variant="secondary" className="text-[10px]">{entry.metodo_aquisicao}</Badge></div></>
                )}
                {entry.pmr_ref && (
                  <><div className="text-muted-foreground">PMR Ref</div>
                  <div>
                    <Link to="/pmr/outputs" className="text-primary underline underline-offset-2 hover:no-underline">
                      {entry.pmr_ref}
                    </Link>
                  </div></>
                )}
                {entry.pa_ref && (
                  <><div className="text-muted-foreground">Ponto Atenção</div><div>{entry.pa_ref}</div></>
                )}
              </div>
            </section>
          )}

          {/* Valores */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Valores ({moeda})</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left pb-1">Origem</th>
                  <th className="text-right pb-1">Atual</th>
                  {moeda === 'USD' && <th className="text-right pb-1 text-muted-foreground/70">Base</th>}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'BID',   v: vals.bid,   b: vals.baseBid },
                  { label: 'Local', v: vals.local, b: vals.baseLocal },
                  { label: 'Total', v: vals.total, b: vals.baseTotal, bold: true },
                ].map(r => (
                  <tr key={r.label} className={cn('border-b border-border/30', r.bold && 'font-semibold')}>
                    <td className="py-1.5 text-muted-foreground">{r.label}</td>
                    <td className="py-1.5 text-right tabular-nums">{f(r.v)}</td>
                    {moeda === 'USD' && <td className="py-1.5 text-right tabular-nums text-muted-foreground">{r.b != null ? fUSD(r.b) : '—'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {moeda === 'USD' && (entry.t_base ?? 0) > 0 && (
              <div className="mt-1 text-right">
                <DeltaCell atual={entry.p_atual} base={entry.t_base} />
              </div>
            )}
          </section>

          {/* Entregas físicas */}
          {entry.ref === 'PT' && (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Entregas Físicas</h3>
              <div className="flex gap-4 flex-wrap">
                {ANOS.map(ano => {
                  const key = ano === 'EOP' ? 'fisica_eop' : `fisica_${ano}` as keyof PepEntry
                  return (
                    <div key={ano} className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] text-muted-foreground">{ano}</span>
                      <EntregaCell flag={entry[key] as number | null} />
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Desembolso */}
          {entry.ref === 'PT' && (entry.desembolso_2025 != null || entry.desembolso_total != null) && (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Desembolso Previsto (US$)</h3>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
                {(['2025','2026','2027','2028','2029'] as const).map(ano => {
                  const v = entry[`desembolso_${ano}` as keyof PepEntry] as number | null
                  return v != null ? (
                    <><div className="text-muted-foreground">{ano}</div><div className="tabular-nums col-span-2">{fShort(v, 'USD')}</div></>
                  ) : null
                })}
                {entry.desembolso_total != null && (
                  <><div className="text-muted-foreground font-semibold">Total</div>
                  <div className="tabular-nums font-semibold col-span-2">{fShort(entry.desembolso_total, 'USD')}</div></>
                )}
              </div>
            </section>
          )}
        </div>
      </aside>
    </>
  )
}

// ─── Tab 1: Hierarquia ────────────────────────────────────────────────────────
function HierarchyTab({ entries: rawEntries, isLoading, moeda, onSelectEntry }: {
  entries: PepEntry[]
  isLoading: boolean
  moeda: 'USD' | 'BRL'
  onSelectEntry: (e: PepEntry) => void
}) {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [allExpanded, setAllExpanded] = useState(true)
  const [filtroRef, setFiltroRef] = useState('todos')
  const [filtroComp, setFiltroComp] = useState('todos')
  const [showFilters, setShowFilters] = useState(false)

  const entries = useMemo(() => sortHierarchically(rawEntries), [rawEntries])

  const comps = useMemo(() => [...new Set(entries.filter(e => e.ref === 'C').map(e => e.comp))].sort((a, b) => (a ?? 0) - (b ?? 0)), [entries])
  const refTypes = useMemo(() => [...new Set(entries.map(e => e.ref))].sort((a, b) => (REF_ORDER[a] ?? 99) - (REF_ORDER[b] ?? 99)), [entries])

  const getKey = (row: PepEntry) => {
    if (row.ref === 'C') return `C:${row.comp}`
    if (row.ref === 'P') return `P:${row.comp}:${row.prod}`
    if (row.ref === 'SP') return `SP:${row.comp}:${row.prod}:${row.subp}`
    return `PT:${row.comp}:${row.prod}:${row.subp}:${row.pct}`
  }

  const hasChildren = (row: PepEntry) => {
    if (row.ref === 'PT') return false
    return entries.some(e => {
      if (row.ref === 'C') return e.comp === row.comp && (e.ref === 'P' || e.ref === 'SC')
      if (row.ref === 'P') return e.comp === row.comp && e.prod === row.prod && e.ref === 'SP'
      if (row.ref === 'SP') return e.comp === row.comp && e.prod === row.prod && e.subp === row.subp && e.ref === 'PT'
      return false
    })
  }

  const toggleCollapse = (key: string) =>
    setCollapsed(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  const collapseAll = () => {
    const cKeys = entries.filter(e => e.ref === 'C').map(e => `C:${e.comp}`)
    setCollapsed(new Set(cKeys))
    setAllExpanded(false)
  }

  const expandAll = () => { setCollapsed(new Set()); setAllExpanded(true) }

  const matchingIds = useMemo(() => {
    if (!search.trim()) return null
    const term = search.toLowerCase()
    const matched = new Set<string>()
    entries.forEach(e => {
      const matchDesc = (e.descricao ?? '').toLowerCase().includes(term)
      const matchWBS  = (e.codigo_wbs ?? '').toLowerCase().includes(term)
      if (matchDesc || matchWBS) matched.add(e.id)
    })
    return matched
  }, [search, entries])

  const isVisible = (row: PepEntry): boolean => {
    if (filtroRef !== 'todos' && row.ref !== filtroRef) {
      if (filtroRef === 'PT') {
        if (!['C', 'P', 'SP', 'PT'].includes(row.ref)) return false
        if (row.ref !== 'PT') {
          const hasPTChild = entries.some(e =>
            e.ref === 'PT' && e.comp === row.comp &&
            (row.ref === 'C' || (row.ref === 'P' && e.prod === row.prod) || (row.ref === 'SP' && e.prod === row.prod && e.subp === row.subp))
          )
          if (!hasPTChild) return false
        }
      } else if (filtroRef === 'SP') {
        if (!['C', 'P', 'SP'].includes(row.ref)) return false
      } else if (filtroRef === 'P') {
        if (!['C', 'P'].includes(row.ref)) return false
      } else if (filtroRef === 'C') {
        if (row.ref !== 'C') return false
      }
    }

    if (filtroComp !== 'todos' && String(row.comp) !== filtroComp) return false

    if (matchingIds !== null) {
      if (matchingIds.has(row.id)) return true
      const hasMatchingChild = entries.some(e =>
        matchingIds.has(e.id) &&
        e.comp === row.comp &&
        (row.ref === 'C' ||
          (row.ref === 'P' && e.prod === row.prod) ||
          (row.ref === 'SP' && e.prod === row.prod && e.subp === row.subp))
      )
      return hasMatchingChild
    }

    if (row.ref === 'C' || row.ref === 'SC') return true
    if (row.ref === 'P') return !collapsed.has(`C:${row.comp}`)
    if (row.ref === 'SP') return !collapsed.has(`C:${row.comp}`) && !collapsed.has(`P:${row.comp}:${row.prod}`)
    if (row.ref === 'PT') {
      return !collapsed.has(`C:${row.comp}`) &&
             !collapsed.has(`P:${row.comp}:${row.prod}`) &&
             !collapsed.has(`SP:${row.comp}:${row.prod}:${row.subp}`)
    }
    return true
  }

  const totals = useMemo(() => {
    const cRows = entries.filter(e => e.ref === 'C' && (filtroComp === 'todos' || String(e.comp) === filtroComp))
    if (moeda === 'BRL') {
      return {
        bid:   cRows.reduce((s, r) => s + (r.k_reais_bid ?? 0), 0),
        local: cRows.reduce((s, r) => s + (r.l_reais_local ?? 0), 0),
        total: cRows.reduce((s, r) => s + (r.m_reais_total ?? 0), 0),
        base:  null as number | null,
      }
    }
    return {
      bid:   cRows.reduce((s, r) => s + (r.n_atual ?? 0), 0),
      local: cRows.reduce((s, r) => s + (r.o_atual ?? 0), 0),
      total: cRows.reduce((s, r) => s + (r.p_atual ?? 0), 0),
      base:  cRows.reduce((s, r) => s + (r.t_base ?? 0), 0),
    }
  }, [entries, moeda, filtroComp])

  const f = moeda === 'BRL' ? fBRL : fUSD

  const visible = entries.filter(isVisible)

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className={cn('grid gap-3', moeda === 'USD' ? 'grid-cols-4' : 'grid-cols-3')}>
        {[
          { label: `Total BID`, value: f(totals.bid) },
          { label: `Total Local`, value: f(totals.local) },
          { label: `Total Programa`, value: f(totals.total) },
          ...(moeda === 'USD' && totals.base != null ? [{ label: 'Total Base', value: fUSD(totals.base) }] : []),
        ].map(item => (
          <Card key={item.label} className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Busca + controles + filtros */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar WBS ou descrição..."
              className="pl-8 h-8 text-xs"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {(filtroRef !== 'todos' || filtroComp !== 'todos') && (
              <Badge variant="secondary" className="ml-1 text-[9px] px-1 py-0">
                {[filtroRef !== 'todos' ? 1 : 0, filtroComp !== 'todos' ? 1 : 0].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>

          {!search && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={allExpanded ? collapseAll : expandAll}>
              {allExpanded ? 'Recolher Tudo' : 'Expandir Tudo'}
            </Button>
          )}

          {search && matchingIds !== null && (
            <span className="text-xs text-muted-foreground">{matchingIds.size} resultado(s)</span>
          )}

          <span className="text-xs text-muted-foreground ml-auto">{visible.length} linhas</span>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/30 rounded-lg border border-border/50">
            <span className="text-xs font-medium text-muted-foreground">Nível:</span>
            <Select value={filtroRef} onValueChange={setFiltroRef}>
              <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os níveis</SelectItem>
                {refTypes.map(r => (
                  <SelectItem key={r} value={r}>{r} — {REF_LABELS[r] ?? r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-xs font-medium text-muted-foreground ml-2">Componente:</span>
            <Select value={filtroComp} onValueChange={setFiltroComp}>
              <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os componentes</SelectItem>
                {comps.map(c => {
                  const desc = entries.find(e => e.ref === 'C' && e.comp === c)?.descricao ?? `C${c}`
                  return <SelectItem key={c!} value={String(c)}>{desc}</SelectItem>
                })}
              </SelectContent>
            </Select>

            {(filtroRef !== 'todos' || filtroComp !== 'todos') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => { setFiltroRef('todos'); setFiltroComp('todos') }}
              >
                <X className="w-3 h-3 mr-1" /> Limpar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabela hierárquica */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">{[...Array(8)].map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}</div>
      ) : entries.length === 0 ? (
        <EmptyState icon={BarChart3} title="Nenhum dado do PEP" description="Execute o script import_pep_supabase.py para popular os dados." />
      ) : (
        <Card>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="gradient-bid text-white">
                  <th className="text-left px-3 py-2.5 min-w-[280px]">WBS / Descrição</th>
                  <th className="text-right px-3 py-2.5">BID {moeda === 'BRL' ? 'R$' : 'US$'}</th>
                  <th className="text-right px-3 py-2.5">Local {moeda === 'BRL' ? 'R$' : 'US$'}</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Total {moeda === 'BRL' ? 'R$' : 'US$'}</th>
                  {moeda === 'USD' && <th className="text-right px-3 py-2.5 text-white/70">Base US$</th>}
                  {moeda === 'USD' && <th className="text-right px-3 py-2.5 text-white/70">Δ%</th>}
                  <th className="text-center px-3 py-2.5 text-white/70">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(row => {
                  const key = getKey(row)
                  const isCollapsed = collapsed.has(key)
                  const canCollapse = hasChildren(row)
                  const indent = REF_INDENT[row.ref] ?? 0
                  const isC  = row.ref === 'C'
                  const isPT = row.ref === 'PT'
                  const highlighted = search && matchingIds?.has(row.id)
                  const vals = getValues(row, moeda)

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b border-border/40 transition-colors cursor-pointer',
                        isC ? 'bg-primary/5 hover:bg-primary/10 font-semibold' : 'hover:bg-muted/40',
                        row.ref === 'P' && 'bg-muted/20',
                        isPT && 'text-muted-foreground',
                        highlighted && 'bg-yellow-50 dark:bg-yellow-900/20',
                      )}
                      onClick={() => onSelectEntry(row)}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1" style={{ paddingLeft: `${indent * 16}px` }}>
                          {canCollapse ? (
                            <button
                              onClick={e => { e.stopPropagation(); toggleCollapse(key) }}
                              className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
                            >
                              {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="w-4 flex-shrink-0" />
                          )}
                          {row.codigo_wbs && (
                            <Link
                              to={`/pep/${encodeURIComponent(row.codigo_wbs)}`}
                              className="font-mono text-[10px] text-primary bg-primary/10 px-1 rounded flex-shrink-0 hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              {row.codigo_wbs}
                            </Link>
                          )}
                          <span className={cn('truncate max-w-[260px]', isC && 'text-primary')} title={row.descricao ?? ''}>
                            {row.descricao}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{f(vals.bid)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{f(vals.local)}</td>
                      <td className={cn('px-3 py-2 text-right tabular-nums', isC && 'font-semibold')}>{f(vals.total)}</td>
                      {moeda === 'USD' && <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{row.t_base ? fUSD(row.t_base) : '—'}</td>}
                      {moeda === 'USD' && <td className="px-3 py-2 text-right"><DeltaCell atual={row.p_atual ?? 0} base={row.t_base ?? 0} /></td>}
                      <td className="px-3 py-2 text-center">
                        <Badge variant="outline" className="text-[10px] px-1.5">{row.ref}</Badge>
                      </td>
                    </tr>
                  )
                })}
                {/* Total row */}
                <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                  <td className="px-3 py-2.5 text-sm">Total Programa</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{f(totals.bid)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{f(totals.local)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{f(totals.total)}</td>
                  {moeda === 'USD' && <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{totals.base != null ? fUSD(totals.base) : '—'}</td>}
                  {moeda === 'USD' && <td className="px-3 py-2.5 text-right">{totals.base != null && totals.base > 0 ? <DeltaCell atual={totals.total} base={totals.base} /> : '—'}</td>}
                  <td className="px-3 py-2.5" />
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Tab 2: Cronograma Físico ─────────────────────────────────────────────────
function CronogramaTab({ entries, onSelectWBS }: { entries: PepEntry[]; onSelectWBS: (wbs: string) => void }) {
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // Use entries already filtered by secretaria from parent
  const rows = useMemo(() =>
    entries.filter(r =>
      r.ref === 'PT' &&
      ((r.fisica_2025 ?? 0) + (r.fisica_2026 ?? 0) + (r.fisica_2027 ?? 0) +
       (r.fisica_2028 ?? 0) + (r.fisica_2029 ?? 0) + (r.fisica_eop ?? 0) > 0)
    ), [entries])

  const tipos = useMemo(() => [...new Set(rows.map(r => r.tipo_aquisicao).filter(Boolean))].sort(), [rows])
  const comps = useMemo(() => [...new Set(rows.map(r => r.comp).filter(c => c != null))].sort((a, b) => (a ?? 0) - (b ?? 0)), [rows])

  const filtered = rows.filter(r => {
    if (filtroTipo !== 'todos' && r.tipo_aquisicao !== filtroTipo) return false
    return true
  })

  const descComp = (comp: number | null) => {
    const c = entries.find(e => e.ref === 'C' && e.comp === comp)
    return c?.descricao ?? `Componente ${comp}`
  }

  if (rows.length === 0) return <EmptyState icon={Calendar} title="Nenhuma entrega física cadastrada" description="Importe o PEP com os dados de entregas físicas (cols AD-AI) para visualizar o cronograma." />

  const byComp = comps.reduce<Record<string, typeof filtered>>((acc, comp) => {
    const key = String(comp)
    const items = filtered.filter(r => String(r.comp) === key)
    if (items.length > 0) acc[key] = items
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Tipo de Aquisição" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {tipos.map(t => <SelectItem key={t!} value={t!}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} entregas</span>
      </div>

      <Card>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead>
              <tr className="gradient-bid text-white">
                <th className="text-left px-3 py-2.5 min-w-[80px]">WBS</th>
                <th className="text-left px-3 py-2.5 min-w-[200px]">Descrição</th>
                <th className="text-left px-3 py-2.5">Tipo</th>
                {ANOS.map(a => (
                  <th key={a} className="text-center px-2 py-2.5 w-12">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(byComp).map(([compKey, items]) => (
                <>
                  <tr key={`hdr-${compKey}`} className="bg-primary/5">
                    <td colSpan={3 + ANOS.length} className="px-3 py-1.5 text-[11px] font-semibold text-primary">
                      {descComp(Number(compKey))}
                    </td>
                  </tr>
                  {items.map(r => (
                    <tr
                      key={r.id}
                      className="border-b border-border/30 hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => r.codigo_wbs && onSelectWBS(r.codigo_wbs)}
                    >
                      <td className="px-3 py-2 font-mono text-[10px] whitespace-nowrap">
                        {r.codigo_wbs ? (
                          <Link
                            to={`/pep/${encodeURIComponent(r.codigo_wbs)}`}
                            className="text-primary hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            {r.codigo_wbs}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 max-w-[200px] truncate" title={r.descricao ?? ''}>{r.descricao}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {r.tipo_aquisicao ? (
                          <Badge variant="outline" className="text-[10px] px-1">{r.tipo_aquisicao}</Badge>
                        ) : '—'}
                      </td>
                      {ANOS.map(ano => {
                        const key = ano === 'EOP' ? 'fisica_eop' : `fisica_${ano}` as keyof typeof r
                        return (
                          <td key={ano} className="text-center px-2 py-2">
                            <EntregaCell flag={r[key] as number | null} />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma entrega com os filtros selecionados.</div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ─── Tab 3: Desembolsos (revised — uses filtered entries) ─────────────────────
function DesembolsosTab({ entries, moeda, filtroSecretaria }: { entries: PepEntry[]; moeda: 'USD' | 'BRL'; filtroSecretaria: string }) {
  // When no secretaria filter, use C rows directly (they have correct totals from the spreadsheet).
  // When filtered, aggregate from PT rows of the filtered set.
  const compRows = useMemo(() => {
    const comps = [...new Set(entries.filter(e => e.ref === 'C').map(e => e.comp))].sort((a, b) => (a ?? 0) - (b ?? 0))

    if (filtroSecretaria === 'todos') {
      // Use C row data directly — accurate totals
      return comps.map(comp => {
        const cRow = entries.find(e => e.ref === 'C' && e.comp === comp)
        if (!cRow) return null
        return {
          comp,
          descricao: cRow.descricao ?? `Componente ${comp}`,
          desembolso_2025: cRow.desembolso_2025 ?? 0,
          desembolso_2026: cRow.desembolso_2026 ?? 0,
          desembolso_2027: cRow.desembolso_2027 ?? 0,
          desembolso_2028: cRow.desembolso_2028 ?? 0,
          desembolso_2029: cRow.desembolso_2029 ?? 0,
          desembolso_total: cRow.desembolso_total ?? 0,
        }
      }).filter(Boolean).filter(r => r!.desembolso_total > 0 || r!.desembolso_2025 > 0) as NonNullable<typeof compRows[0]>[]
    }

    // Filtered by secretaria — aggregate from PT rows
    const ptRows = entries.filter(e => e.ref === 'PT')
    return comps.map(comp => {
      const cRow = entries.find(e => e.ref === 'C' && e.comp === comp)
      const pts = ptRows.filter(e => e.comp === comp)
      const sumField = (field: keyof PepEntry) => pts.reduce((s, r) => s + ((r[field] as number | null) ?? 0), 0)
      return {
        comp,
        descricao: cRow?.descricao ?? `Componente ${comp}`,
        desembolso_2025: sumField('desembolso_2025'),
        desembolso_2026: sumField('desembolso_2026'),
        desembolso_2027: sumField('desembolso_2027'),
        desembolso_2028: sumField('desembolso_2028'),
        desembolso_2029: sumField('desembolso_2029'),
        desembolso_total: sumField('desembolso_total'),
      }
    }).filter(r => r.desembolso_total > 0 || r.desembolso_2025 > 0)
  }, [entries, filtroSecretaria])

  const chartData = useMemo(() => {
    return ANOS_DESEMBOLSO.map(ano => {
      const entry: Record<string, number | string> = { ano }
      compRows.forEach(r => {
        const label = (r.descricao ?? '').replace(/^C\d+\s*[-–]\s*/i, '').substring(0, 18)
        const key = `desembolso_${ano}` as keyof typeof r
        entry[label] = (r[key] as number) ?? 0
      })
      return entry
    })
  }, [compRows])

  const compLabels = useMemo(
    () => compRows.map(r => (r.descricao ?? '').replace(/^C\d+\s*[-–]\s*/i, '').substring(0, 18)),
    [compRows]
  )

  const totaisPorAno = useMemo(() =>
    ANOS_DESEMBOLSO.map(ano => {
      const key = `desembolso_${ano}` as keyof (typeof compRows)[0]
      return { ano, total: compRows.reduce((s, r) => s + ((r[key] as number) ?? 0), 0) }
    }),
    [compRows]
  )

  if (compRows.length === 0) return <EmptyState icon={DollarSign} title="Dados de desembolso indisponíveis" description="Importe o PEP expandido para visualizar os desembolsos anuais." />

  const prefix = moeda === 'BRL' ? 'R$' : 'US$'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-2">
        {totaisPorAno.map(({ ano, total }) => (
          <Card key={ano} className="p-3">
            <p className="text-[10px] text-muted-foreground">{ano}</p>
            <p className="text-sm font-bold tabular-nums mt-0.5">{fShort(total, moeda)}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Desembolso Previsto por Componente ({prefix})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={v => `${prefix}${(Number(v)/1e6).toFixed(0)}M`}
                tick={{ fontSize: 10 }}
                width={60}
              />
              <RTooltip
                formatter={(value: number, name: string) => [fShort(value, moeda), name]}
                contentStyle={{ fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {compLabels.map((label, i) => (
                 <Area
                   key={label}
                   type="monotone"
                   dataKey={label}
                   stroke={COMP_COLORS[i % COMP_COLORS.length]}
                   fill={COMP_COLORS[i % COMP_COLORS.length]}
                   fillOpacity={0.15}
                 />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Desembolso por Componente</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="gradient-bid text-white">
                  <th className="text-left px-3 py-2.5">Componente</th>
                  {ANOS_DESEMBOLSO.map(a => (
                    <th key={a} className="text-right px-3 py-2.5">{a}</th>
                  ))}
                  <th className="text-right px-3 py-2.5 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {compRows.map((r, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium max-w-[200px] truncate" title={r.descricao ?? ''}>{r.descricao}</td>
                    {ANOS_DESEMBOLSO.map(ano => {
                      const key = `desembolso_${ano}` as keyof typeof r
                      return <td key={ano} className="px-3 py-2 text-right tabular-nums">{fShort((r[key] as number) ?? 0, moeda)}</td>
                    })}
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{fShort(r.desembolso_total ?? 0, moeda)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                  <td className="px-3 py-2">Total Programa</td>
                  {totaisPorAno.map(({ ano, total }) => (
                    <td key={ano} className="px-3 py-2 text-right tabular-nums">{fShort(total, moeda)}</td>
                  ))}
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fShort(compRows.reduce((s, r) => s + (r.desembolso_total ?? 0), 0), moeda)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab 4: PMR ───────────────────────────────────────────────────────────────
function PMRTab({ pepEntries }: { pepEntries: PepEntry[] }) {
  const { data: outputs = [], isLoading: loadingOut } = usePMROutputs()
  const { data: outcomes = [], isLoading: loadingOc } = usePMROutcomes()

  const pepByPmrRef = useMemo(() => {
    const m: Record<string, PepEntry[]> = {}
    pepEntries.filter(e => e.ref === 'PT' && e.pmr_ref).forEach(e => {
      const refs = (e.pmr_ref ?? '').split(',').map(r => r.trim())
      refs.forEach(ref => { m[ref] = [...(m[ref] ?? []), e] })
    })
    return m
  }, [pepEntries])

  const PctBadge = ({ pct }: { pct: number }) => (
    <span className={cn(
      'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold',
      pct >= 80 ? 'bg-green-100 text-green-700' :
      pct >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
    )}>{pct.toFixed(0)}%</span>
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">PMR Outputs — Indicadores Físicos</h3>
        {loadingOut ? (
          <div className="space-y-1 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}</div>
        ) : (
          <Card>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="gradient-bid text-white">
                    <th className="text-left px-3 py-2.5">Código</th>
                    <th className="text-left px-3 py-2.5 min-w-[200px]">Indicador</th>
                    <th className="text-left px-3 py-2.5">WBS PEP</th>
                    <th className="text-right px-3 py-2.5">Realizado</th>
                    <th className="text-right px-3 py-2.5">Meta</th>
                    <th className="text-right px-3 py-2.5">%</th>
                  </tr>
                </thead>
                <tbody>
                  {outputs.map(o => {
                    const pct = o.meta_contrato && o.meta_contrato > 0 ? (o.realizado / o.meta_contrato) * 100 : null
                    const pepRefs = pepByPmrRef[o.codigo ?? ''] ?? []
                    return (
                      <tr key={o.id} className="border-b border-border/30 hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono">{o.codigo}</td>
                        <td className="px-3 py-2 max-w-[220px] truncate" title={o.descricao ?? ''}>{o.descricao}</td>
                        <td className="px-3 py-2">
                          {pepRefs.length > 0 ? (
                            <span className="flex flex-wrap gap-1">
                              {pepRefs.slice(0, 2).map(pe => (
                                <span key={pe.id} className="font-mono text-[10px] bg-muted px-1 rounded" title={pe.descricao ?? ''}>
                                  {pe.codigo_wbs ?? '—'}
                                </span>
                              ))}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{o.realizado ?? '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{o.meta_contrato ?? '—'}</td>
                        <td className="px-3 py-2 text-right">{pct !== null ? <PctBadge pct={pct} /> : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {outputs.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhum output cadastrado.</div>}
            </div>
          </Card>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">PMR Outcomes — Indicadores de Impacto</h3>
        {loadingOc ? (
          <div className="space-y-1 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}</div>
        ) : (
          <Card>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="gradient-bid text-white">
                    <th className="text-left px-3 py-2.5">Código</th>
                    <th className="text-left px-3 py-2.5 min-w-[200px]">Indicador</th>
                    <th className="text-right px-3 py-2.5">Realizado</th>
                    <th className="text-right px-3 py-2.5">Meta</th>
                    <th className="text-right px-3 py-2.5">%</th>
                  </tr>
                </thead>
                <tbody>
                  {outcomes.map(o => {
                    const pct = o.meta_contrato && o.meta_contrato > 0 ? (o.realizado / o.meta_contrato) * 100 : null
                    return (
                      <tr key={o.id} className="border-b border-border/30 hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono">{o.codigo}</td>
                        <td className="px-3 py-2 max-w-[220px] truncate" title={o.descricao ?? ''}>{o.descricao}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{o.realizado ?? '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{o.meta_contrato ?? '—'}</td>
                        <td className="px-3 py-2 text-right">{pct !== null ? <PctBadge pct={pct} /> : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {outcomes.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhum outcome cadastrado.</div>}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function PEPPage() {
  const [versao, setVersao] = useState('v2')
  const [moeda, setMoeda] = useState<'USD' | 'BRL'>('USD')
  const [filtroSecretaria, setFiltroSecretaria] = useState('todos')
  const [filtroLote, setFiltroLote] = useState('todos')
  const [selectedEntry, setSelectedEntry] = useState<PepEntry | null>(null)
  const [activeTab, setActiveTab] = useState('hierarquia')
  const [syncing, setSyncing] = useState(false)

  const queryClient = useQueryClient()
  const { data: versoes = [] } = usePEPVersoes()
  const { data: entries = [], isLoading } = usePEPEntries(versao)

  // Derive secretaria list from PT entries
  const secretarias = useMemo(() =>
    [...new Set(entries.filter(e => e.ref === 'PT' && e.secretaria).map(e => e.secretaria!))].sort(),
    [entries]
  )

  // Derive lote list from PT entries
  const lotes = useMemo(() =>
    [...new Set(entries.filter(e => e.ref === 'PT' && (e as any).lote).map(e => (e as any).lote as string))].sort(),
    [entries]
  )

  const isFiltered = filtroSecretaria !== 'todos' || filtroLote !== 'todos'

  // Apply global filters
  const filteredEntries = useMemo(() =>
    filterEntries(entries, filtroSecretaria, filtroLote),
    [entries, filtroSecretaria, filtroLote]
  )

  // Global totals (always from all entries, C rows)
  const globalTotals = useMemo(() => {
    const cRows = entries.filter(e => e.ref === 'C')
    const f = moeda === 'BRL'
    return {
      bid:   cRows.reduce((s, r) => s + (f ? (r.k_reais_bid ?? 0) : (r.n_atual ?? 0)), 0),
      local: cRows.reduce((s, r) => s + (f ? (r.l_reais_local ?? 0) : (r.o_atual ?? 0)), 0),
      total: cRows.reduce((s, r) => s + (f ? (r.m_reais_total ?? 0) : (r.p_atual ?? 0)), 0),
      base:  f ? null : cRows.reduce((s, r) => s + (r.t_base ?? 0), 0),
    }
  }, [entries, moeda])

  // Filtered totals (aggregated from filtered PT rows)
  const filteredTotals = useMemo(() => {
    if (!isFiltered) return null
    const ptRows = filteredEntries.filter(e => e.ref === 'PT')
    const f = moeda === 'BRL'
    return {
      bid:   ptRows.reduce((s, r) => s + (f ? (r.k_reais_bid ?? 0) : (r.n_atual ?? 0)), 0),
      local: ptRows.reduce((s, r) => s + (f ? (r.l_reais_local ?? 0) : (r.o_atual ?? 0)), 0),
      total: ptRows.reduce((s, r) => s + (f ? (r.m_reais_total ?? 0) : (r.p_atual ?? 0)), 0),
      base:  f ? null : ptRows.reduce((s, r) => s + (r.t_base ?? 0), 0),
      ptCount: ptRows.length,
    }
  }, [filteredEntries, moeda, isFiltered])

  const handleSelectEntry = (entry: PepEntry) => setSelectedEntry(entry)

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'dvqnlnxkwcrxbctujajl'
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/sync-pep-sheets?versao=${versao}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      )
      const data = await resp.json()
      if (data.success) {
        toast.success(`Sincronização concluída: ${data.rows} registros importados`)
        queryClient.invalidateQueries({ queryKey: ['pep'] })
        queryClient.invalidateQueries({ queryKey: ['pep_kpis'] })
        queryClient.invalidateQueries({ queryKey: ['pep_versoes'] })
        queryClient.invalidateQueries({ queryKey: ['pep_desembolhos'] })
        queryClient.invalidateQueries({ queryKey: ['pep_cronograma'] })
        queryClient.invalidateQueries({ queryKey: ['pep_chart'] })
      } else {
        toast.error(`Erro na sincronização: ${data.error}`)
      }
    } catch (err) {
      toast.error('Falha ao conectar com a Edge Function')
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }, [versao, queryClient])

  const handleSelectWBS = (wbs: string) => {
    const entry = entries.find(e => e.codigo_wbs === wbs)
    if (entry) setSelectedEntry(entry)
  }

  const fCurr = moeda === 'BRL' ? fBRL : fUSD
  const filterLabel = [
    filtroSecretaria !== 'todos' ? filtroSecretaria : null,
    filtroLote !== 'todos' ? `Lote ${filtroLote}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">PEP RS — Plano de Execução</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Estrutura WBS C→P→SP→PT · valores BID e Local · cronograma físico e desembolsos
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Planilha'}
          </Button>

          {/* Secretaria filter */}
          <Select value={filtroSecretaria} onValueChange={setFiltroSecretaria}>
            <SelectTrigger className={cn('w-44 h-8 text-xs', filtroSecretaria !== 'todos' && 'border-primary')}>
              <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Secretaria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Secretarias</SelectItem>
              {secretarias.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Lote filter */}
          {lotes.length > 0 && (
            <Select value={filtroLote} onValueChange={setFiltroLote}>
              <SelectTrigger className={cn('w-36 h-8 text-xs', filtroLote !== 'todos' && 'border-primary')}>
                <Package className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Lote" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Lotes</SelectItem>
                {lotes.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            <button
              className={cn('px-3 py-1.5 transition-colors', moeda === 'USD' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              onClick={() => setMoeda('USD')}
            >USD</button>
            <button
              className={cn('px-3 py-1.5 transition-colors', moeda === 'BRL' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              onClick={() => setMoeda('BRL')}
            >R$</button>
          </div>

          {versoes.length > 1 && (
            <Select value={versao} onValueChange={setVersao}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {versoes.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Global KPIs — always show program totals */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 font-medium">
          {isFiltered ? '🌐 Totais Globais do Programa' : 'Totais do Programa'}
        </p>
        <div className={cn('grid gap-3', moeda === 'USD' ? 'grid-cols-4' : 'grid-cols-3')}>
          {[
            { label: 'Total BID', value: fCurr(globalTotals.bid) },
            { label: 'Total Local', value: fCurr(globalTotals.local) },
            { label: 'Total Programa', value: fCurr(globalTotals.total) },
            ...(moeda === 'USD' && globalTotals.base != null ? [{ label: 'Total Base', value: fUSD(globalTotals.base) }] : []),
          ].map(item => (
            <Card key={item.label} className={cn('p-3', isFiltered && 'opacity-70')}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
              <p className="text-lg font-bold tabular-nums mt-0.5">{item.value}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Filtered KPIs — show only when filter is active */}
      {isFiltered && filteredTotals && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              🔍 Totais Filtrados — {filterLabel}
            </p>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{filteredTotals.ptCount} PTs</Badge>
          </div>
          <div className={cn('grid gap-3', moeda === 'USD' ? 'grid-cols-4' : 'grid-cols-3')}>
            {[
              { label: `BID — ${filterLabel}`, value: fCurr(filteredTotals.bid) },
              { label: `Local — ${filterLabel}`, value: fCurr(filteredTotals.local) },
              { label: `Total — ${filterLabel}`, value: fCurr(filteredTotals.total) },
              ...(moeda === 'USD' && filteredTotals.base != null ? [{ label: `Base — ${filterLabel}`, value: fUSD(filteredTotals.base) }] : []),
            ].map(item => (
              <Card key={item.label} className="p-3 border-primary/30 bg-primary/5">
                <p className="text-[10px] text-primary uppercase tracking-wide">{item.label}</p>
                <p className="text-lg font-bold tabular-nums mt-0.5">{item.value}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isFiltered && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span>Filtrando por <strong>{filterLabel}</strong></span>
          <span className="text-muted-foreground">({filteredEntries.filter(e => e.ref === 'PT').length} pacotes de trabalho)</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto" onClick={() => { setFiltroSecretaria('todos'); setFiltroLote('todos') }}>
            <X className="w-3 h-3 mr-1" /> Limpar Filtros
          </Button>
        </div>
      )}

      <DataSourcePanel
        source="PEP RS — PEP_PMR.xlsx"
        url="https://docs.google.com/spreadsheets/d/1C6uIqjqwpgToNWm3YqliqKzb2gPb8cHC"
        tabela="pep_entries"
        versao={versao}
        defaultOpen={false}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="hierarquia" className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />Hierarquia
          </TabsTrigger>
          <TabsTrigger value="cronograma" className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />Cronograma Físico
          </TabsTrigger>
          <TabsTrigger value="desembolsos" className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />Desembolsos
          </TabsTrigger>
          <TabsTrigger value="pmr" className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />PMR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarquia" className="mt-4">
          <HierarchyTab
            entries={filteredEntries}
            isLoading={isLoading}
            moeda={moeda}
            onSelectEntry={handleSelectEntry}
          />
        </TabsContent>

        <TabsContent value="cronograma" className="mt-4">
          <CronogramaTab entries={filteredEntries} onSelectWBS={handleSelectWBS} />
        </TabsContent>

        <TabsContent value="desembolsos" className="mt-4">
          <DesembolsosTab entries={filteredEntries} moeda={moeda} filtroSecretaria={filtroSecretaria} />
        </TabsContent>

        <TabsContent value="pmr" className="mt-4">
          <PMRTab pepEntries={filteredEntries} />
        </TabsContent>
      </Tabs>

      {selectedEntry && (
        <DetailPanel
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          moeda={moeda}
        />
      )}
    </div>
  )
}
