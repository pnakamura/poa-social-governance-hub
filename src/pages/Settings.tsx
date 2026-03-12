import { useState } from 'react'
import { Upload, Database, RefreshCw, Settings as SettingsIcon, Eye, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { NAV_GROUPS, PROTECTED_ROUTES } from '@/config/nav-items'
import { useMenuVisibility } from '@/hooks/useMenuVisibility'

export default function Settings() {
  const qc = useQueryClient()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const { isVisible, setRouteVisible, resetAll } = useMenuVisibility()

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const { data, error } = await supabase.from('pep_entries').select('id').limit(1)
      if (error) throw error
      setTestResult(`✓ Conexão OK — ${data?.length ?? 0} registro(s) em pep_entries`)
    } catch (e: any) {
      setTestResult(`✗ Erro: ${e.message}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerenciamento de dados e integrações</p>
      </div>

      {/* Menu visibility */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Módulos Visíveis
            </CardTitle>
            <Button onClick={resetAll} variant="ghost" size="sm" className="gap-1.5 text-xs h-7">
              <RotateCcw className="w-3 h-3" />
              Restaurar padrão
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Escolha quais módulos aparecem no menu lateral. Dashboard e Configurações estão sempre visíveis.
          </p>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ to, icon: Icon, label }) => {
                  const isProtected = PROTECTED_ROUTES.includes(to)
                  return (
                    <div
                      key={to}
                      className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor={`vis-${to}`} className="text-sm font-normal cursor-pointer">
                          {label}
                        </Label>
                      </div>
                      <Switch
                        id={`vis-${to}`}
                        checked={isVisible(to)}
                        onCheckedChange={(checked) => setRouteVisible(to, checked)}
                        disabled={isProtected}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Supabase status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="w-4 h-4" />
            Conexão Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg text-sm font-mono text-muted-foreground">
            {import.meta.env.VITE_SUPABASE_URL ?? 'URL não configurada'}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={testConnection} disabled={testing} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              Testar conexão
            </Button>
            {testResult && (
              <span className={`text-sm ${testResult.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {testResult}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Importação de Dados (PEP/PMR)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para importar dados da planilha PEP RS, execute o script Python no terminal:
          </p>
          <div className="bg-gray-950 text-green-400 rounded-lg p-4 font-mono text-xs leading-relaxed">
            <p className="text-gray-500"># Instalar dependências</p>
            <p>pip install openpyxl supabase</p>
            <p className="mt-2 text-gray-500"># Importar planilha (versão v2)</p>
            <p>python scripts/import_pep_supabase.py caminho/planilha.xlsx --versao v2</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => qc.invalidateQueries()}>
              <RefreshCw className="w-4 h-4" />
              Recarregar dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schema */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Schema do Banco de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Se as tabelas ainda não foram criadas no Supabase, execute a migration:
          </p>
          <div className="bg-gray-950 text-green-400 rounded-lg p-4 font-mono text-xs">
            <p className="text-gray-500"># Opção 1: Supabase Dashboard → SQL Editor</p>
            <p>-- Cole o conteúdo de: supabase/migrations/001_initial_schema.sql</p>
            <p className="mt-2 text-gray-500"># Opção 2: Script Python</p>
            <p>python scripts/apply_schema.py</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
