import { Component, type ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-destructive text-xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-semibold">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {(this.state.error as Error).message ?? 'Erro inesperado. Recarregue a página.'}
          </p>
          <button
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
          >
            Voltar ao início
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

import { AppLayout } from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import ProgramProfile from '@/pages/ProgramProfile'
import PEPPage from '@/pages/PEP/index'
import PMROutputs from '@/pages/PMR/Outputs'
import PMROutcomes from '@/pages/PMR/Outcomes'
import Risks from '@/pages/Risks'
import Activities from '@/pages/Activities'
import NoObjections from '@/pages/NoObjections'
import Analysis from '@/pages/Analysis'
import Inteligencia from '@/pages/Inteligencia'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Marcos from '@/pages/Marcos'
import PontosAtencao from '@/pages/PontosAtencao'
import Aquisicoes from '@/pages/Aquisicoes'
import Temas from '@/pages/Temas'
import Monitoramento from '@/pages/Monitoramento'
import Qualidade from '@/pages/Qualidade'
import Conhecimento from '@/pages/Conhecimento'
import PEPAnalisePage from '@/pages/PEP/Analise'
import PEPDetalhePage from '@/pages/PEP/Detalhe'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="programa" element={<ProgramProfile />} />
              <Route path="pep" element={<PEPPage />} />
              <Route path="pmr/outputs" element={<PMROutputs />} />
              <Route path="pmr/outcomes" element={<PMROutcomes />} />
              <Route path="riscos" element={<Risks />} />
              <Route path="atividades" element={<Activities />} />
              <Route path="nao-objecoes" element={<NoObjections />} />
              <Route path="analise" element={<Analysis />} />
              <Route path="inteligencia" element={<Inteligencia />} />
              <Route path="relatorios" element={<Reports />} />
              <Route path="configuracoes" element={<Settings />} />
              <Route path="marcos" element={<Marcos />} />
              <Route path="pontos-atencao" element={<PontosAtencao />} />
              <Route path="aquisicoes" element={<Aquisicoes />} />
              <Route path="temas" element={<Temas />} />
              <Route path="monitoramento" element={<Monitoramento />} />
              <Route path="qualidade-dados" element={<Qualidade />} />
              <Route path="conhecimento" element={<Conhecimento />} />
              <Route path="pep/analise" element={<PEPAnalisePage />} />
              <Route path="pep/:wbs" element={<PEPDetalhePage />} />
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-64 gap-2">
                  <p className="text-3xl font-bold text-muted-foreground">404</p>
                  <p className="text-sm text-muted-foreground">Página não encontrada</p>
                </div>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}
