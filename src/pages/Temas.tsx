import { Link } from 'react-router-dom'
import { ArrowRight, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TEMAS } from '@/data/temas'

export default function Temas() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="gradient-bid rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Temas Estratégicos</h1>
        </div>
        <p className="text-white/70 text-sm">
          Os quatro eixos estruturantes do programa POA+SOCIAL BID (BR-L1597)
        </p>
      </div>

      {/* Grid de temas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TEMAS.map(tema => (
          <Card key={tema.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-2xl">{tema.icone}</span>
                {tema.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{tema.descricao}</p>

              {/* Componentes */}
              <div className="flex gap-1 flex-wrap">
                {tema.componentes.map(c => (
                  <Badge key={c} variant="default" className="text-xs h-5 px-2 bg-primary/80">
                    {c}
                  </Badge>
                ))}
              </div>

              {/* Subtemas */}
              <ul className="space-y-1">
                {tema.subtemas.map(sub => (
                  <li key={sub} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    {sub}
                  </li>
                ))}
              </ul>

              {/* Links */}
              <div className="flex gap-2 pt-1 flex-wrap">
                {tema.areasRelacionadas.includes('obras') && (
                  <Link to="/pontos-atencao" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Ver pontos de atenção <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
                {tema.areasRelacionadas.includes('aquisicoes') && (
                  <Link to="/aquisicoes" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Ver aquisições <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instrumentos de gestão */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Instrumentos de Gestão do Programa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {[
              { sigla: 'PEP RS', nome: 'Plano de Execução do Projeto — Resumo Simples', frequencia: 'Trimestral', rota: '/pep' },
              { sigla: 'PMR',    nome: 'Plano de Monitoramento e Resultados', frequencia: 'Semestral', rota: '/pmr/outputs' },
              { sigla: 'ROP',    nome: 'Regulamento Operativo do Programa', frequencia: 'Fixo', rota: null },
              { sigla: 'MPAS',   nome: 'Marco de Política Ambiental e Social', frequencia: 'Anual', rota: null },
              { sigla: 'PDAS',   nome: 'Plano de Gestão Ambiental e Social', frequencia: 'Contínuo', rota: null },
              { sigla: 'MdR',    nome: 'Matriz de Riscos', frequencia: 'Semestral', rota: '/riscos' },
              { sigla: 'PA',     nome: 'Plano de Aquisições', frequencia: 'Contínuo', rota: '/aquisicoes' },
              { sigla: 'DFA',    nome: 'Demonstrativo de Fontes e Aplicações', frequencia: 'Semestral', rota: null },
            ].map(inst => (
              <div key={inst.sigla} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20">
                <div className="w-14 text-center">
                  <Badge variant="outline" className="text-xs font-mono">{inst.sigla}</Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{inst.nome}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{inst.frequencia}</span>
                  {inst.rota && (
                    <Link to={inst.rota} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                      Ver <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
