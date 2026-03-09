import { useState } from 'react'
import { Radar, Plus, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { HelpTooltip } from '@/components/HelpTooltip'
import { useTemas, useAddTema, useRemoveTema, useTemaMatches } from '@/hooks/useTemas'
import type { TemaMonitoramento } from '@/lib/supabase'

// ─── Card de um tema com resultados ──────────────────────────────────────────
function TemaCard({ tema }: { tema: TemaMonitoramento }) {
  const removeTema = useRemoveTema()
  const { data: matches, isLoading } = useTemaMatches(tema.palavras_chave)

  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base">{tema.nome}</h3>
              {matches && (
                <Badge variant="secondary" className="text-xs">
                  {matches.total} match{matches.total !== 1 ? 'es' : ''}
                </Badge>
              )}
              <HelpTooltip id="tema-matches" />
            </div>
            {tema.descricao && (
              <p className="text-xs text-muted-foreground mt-0.5">{tema.descricao}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {tema.palavras_chave.map((k) => (
                <Badge key={k} variant="outline" className="text-xs">
                  #{k}
                </Badge>
              ))}
              <HelpTooltip id="tema-palavras-chave" />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={() => removeTema.mutate(tema.id)}
            disabled={removeTema.isPending}
            title="Remover tema"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded" />
            ))}
          </div>
        ) : !matches || matches.total === 0 ? (
          <p className="text-sm text-muted-foreground italic py-3">
            Nenhum dado encontrado para as palavras-chave deste tema.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            {/* Riscos */}
            {matches.riscos.length > 0 && (
              <MatchSection title="Riscos" count={matches.riscos.length} color="text-red-600">
                {matches.riscos.map((r) => (
                  <MatchItem key={r.id} badge={r.categoria ?? 'risco'} text={r.descricao} />
                ))}
              </MatchSection>
            )}

            {/* Atividades */}
            {matches.atividades.length > 0 && (
              <MatchSection title="Atividades" count={matches.atividades.length} color="text-blue-600">
                {matches.atividades.map((a) => (
                  <MatchItem key={a.id} badge={a.status} text={a.titulo} />
                ))}
              </MatchSection>
            )}

            {/* Pontos de Atenção */}
            {matches.pontosAtencao.length > 0 && (
              <MatchSection title="Pontos de Atenção" count={matches.pontosAtencao.length} color="text-yellow-600">
                {matches.pontosAtencao.map((p) => (
                  <MatchItem key={p.id} badge={p.criticidade} text={p.tema} />
                ))}
              </MatchSection>
            )}

            {/* Aquisições */}
            {matches.aquisicoes.length > 0 && (
              <MatchSection title="Aquisições" count={matches.aquisicoes.length} color="text-green-600">
                {matches.aquisicoes.map((aq) => (
                  <MatchItem key={aq.id} badge={aq.status} text={aq.titulo} />
                ))}
              </MatchSection>
            )}

            {/* Marcos */}
            {matches.marcos.length > 0 && (
              <MatchSection title="Marcos" count={matches.marcos.length} color="text-purple-600">
                {matches.marcos.map((m) => (
                  <MatchItem key={m.id} badge={m.tipo} text={m.titulo} />
                ))}
              </MatchSection>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MatchSection({ title, count, color, children }: {
  title: string
  count: number
  color: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className={`text-xs font-semibold mb-1.5 ${color}`}>
        {title} ({count})
      </p>
      <ul className="space-y-1">
        {children}
      </ul>
    </div>
  )
}

function MatchItem({ badge, text }: { badge?: string; text?: string }) {
  return (
    <li className="flex items-start gap-1.5 text-xs">
      {badge && (
        <Badge variant="outline" className="text-[10px] py-0 px-1 flex-shrink-0 leading-4">
          {badge}
        </Badge>
      )}
      <span className="text-muted-foreground line-clamp-2">{text ?? '—'}</span>
    </li>
  )
}

// ─── Formulário de adicionar tema ─────────────────────────────────────────────
function AddTemaForm() {
  const [nome, setNome] = useState('')
  const [keywords, setKeywords] = useState('')
  const addTema = useAddTema()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const palavrasChave = keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
    if (!nome.trim() || palavrasChave.length === 0) return
    addTema.mutate(
      { nome: nome.trim(), palavrasChave },
      {
        onSuccess: () => {
          setNome('')
          setKeywords('')
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <Input
        placeholder="Nome do tema (ex: obras de saúde)"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="sm:w-56"
        required
      />
      <Input
        placeholder="palavras, chave, separadas"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        className="flex-1"
        required
      />
      <Button type="submit" disabled={addTema.isPending || !nome.trim() || !keywords.trim()}>
        <Plus className="w-4 h-4 mr-1" />
        Adicionar
      </Button>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Monitoramento() {
  const { data: temas, isLoading } = useTemas()
  const [busca, setBusca] = useState('')

  const temasFiltrados = (temas ?? []).filter(
    (t) =>
      t.nome.toLowerCase().includes(busca.toLowerCase()) ||
      t.palavras_chave.some((k) => k.toLowerCase().includes(busca.toLowerCase())),
  )

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Radar className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Monitoramento de Temas</h1>
          <HelpTooltip id="monitoramento-temas" />
        </div>
        <p className="text-sm text-muted-foreground">
          Acompanhe temas transversais em todas as fontes de dados do programa.
        </p>
      </div>

      {/* Formulário de adição */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Novo Tema de Monitoramento
        </p>
        <AddTemaForm />
        <p className="text-xs text-muted-foreground mt-2">
          Separe as palavras-chave por vírgula. A busca é por similaridade (não exata).
        </p>
      </Card>

      {/* Barra de busca + contagem */}
      {(temas ?? []).length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Filtrar temas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {temasFiltrados.length} tema{temasFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Lista de temas */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : temasFiltrados.length === 0 ? (
        <Card className="p-8 text-center">
          <Radar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {(temas ?? []).length === 0
              ? 'Nenhum tema cadastrado. Adicione palavras-chave para começar o monitoramento.'
              : 'Nenhum tema encontrado para o filtro aplicado.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {temasFiltrados.map((tema) => (
            <TemaCard key={tema.id} tema={tema} />
          ))}
        </div>
      )}
    </div>
  )
}
