import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Upload, Trash2, FileText, BookOpen, Loader2, ExternalLink, Info, Search, Database, Hash, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const SOURCE_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'google_drive', label: 'Google Drive' },
  { value: 'gmail', label: 'Gmail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'web', label: 'Web' },
]

const SOURCE_COLORS: Record<string, string> = {
  manual: 'bg-muted text-muted-foreground',
  google_drive: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  gmail: 'bg-red-500/15 text-red-700 dark:text-red-400',
  whatsapp: 'bg-green-500/15 text-green-700 dark:text-green-400',
  web: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
}

export default function Conhecimento() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sourceType, setSourceType] = useState('manual')
  const [sourceUrl, setSourceUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  const { data: documents, isLoading } = useQuery({
    queryKey: ['rag_documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rag_documents')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const ingestMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('rag-ingest', {
        body: {
          title,
          content,
          source_type: sourceType,
          source_url: sourceUrl || undefined,
        },
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`Documento ingerido: ${data.chunks_count} chunks criados`)
      setTitle('')
      setContent('')
      setSourceUrl('')
      queryClient.invalidateQueries({ queryKey: ['rag_documents'] })
    },
    onError: (err) => toast.error(`Erro na ingestão: ${err.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error: chunkErr } = await supabase.from('rag_chunks').delete().eq('document_id', docId)
      if (chunkErr) throw chunkErr
      const { error } = await supabase.from('rag_documents').delete().eq('id', docId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Documento excluído com sucesso')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['rag_documents'] })
    },
    onError: (err) => {
      toast.error(`Erro ao excluir: ${err.message}`)
      setDeleteTarget(null)
    },
  })

  const handleFileRead = useCallback((file: File) => {
    if (!file.name.match(/\.(txt|md|markdown)$/i)) {
      toast.error('Apenas arquivos .txt ou .md são aceitos')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setContent(text)
      if (!title) setTitle(file.name.replace(/\.(txt|md|markdown)$/i, ''))
      toast.success(`Arquivo "${file.name}" carregado`)
    }
    reader.readAsText(file)
  }, [title])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileRead(file)
  }, [handleFileRead])

  // Stats
  const totalDocs = documents?.length ?? 0
  const totalChunks = documents?.reduce((sum, d) => sum + (d.chunk_count ?? 0), 0) ?? 0
  const sourceBreakdown = documents?.reduce((acc, d) => {
    acc[d.source_type] = (acc[d.source_type] || 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  // Filtered documents
  const filtered = documents?.filter(doc => {
    if (filterSource !== 'all' && doc.source_type !== filterSource) return false
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Base de Conhecimento</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ingira documentos para alimentar o assistente RAG com informações do programa.
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalDocs}</p>
              <p className="text-xs text-muted-foreground">Documentos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/50 p-2.5">
              <Hash className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalChunks}</p>
              <p className="text-xs text-muted-foreground">Chunks</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{Object.keys(sourceBreakdown).length}</p>
              <p className="text-xs text-muted-foreground">Fontes Ativas</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2.5">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums truncate">
                {documents?.[0] ? format(new Date(documents[0].created_at), 'dd/MM', { locale: ptBR }) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Última Ingestão</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingestion Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="w-4 h-4" /> Ingerir Documento
            </CardTitle>
            <CardDescription>Cole o conteúdo ou arraste um arquivo .txt/.md</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Relatório PMR 2025" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo de Fonte</Label>
                  <Select value={sourceType} onValueChange={setSourceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>URL da Fonte</Label>
                  <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div
              className={cn(
                'space-y-2 rounded-lg transition-all',
                isDragging && 'ring-2 ring-primary bg-primary/5 p-2'
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Cole o texto do documento aqui ou arraste um arquivo .txt/.md..."
                className="min-h-[200px] font-mono text-xs"
              />
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".txt,.md,.markdown"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileRead(e.target.files[0])}
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span><FileText className="w-3 h-3 mr-1" /> Carregar arquivo</span>
                  </Button>
                </label>
                {content.length > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {content.length.toLocaleString()} caracteres · ~{Math.ceil(content.length / 1000)} chunks estimados
                  </span>
                )}
              </div>
            </div>

            <Button
              onClick={() => ingestMutation.mutate()}
              disabled={!title || !content || ingestMutation.isPending}
              className="w-full sm:w-auto"
            >
              {ingestMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {ingestMutation.isPending ? 'Processando...' : 'Ingerir Documento'}
            </Button>

            {ingestMutation.isPending && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Processando chunking e embeddings...</p>
                <Progress className="h-1.5" value={undefined} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* n8n Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="w-4 h-4" /> Ingestão Automática
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Use workflows <strong className="text-foreground">n8n</strong> para ingerir automaticamente de:
            </p>
            <ul className="space-y-1.5">
              {[
                { label: 'Google Drive', desc: 'Polling de PDFs e Docs' },
                { label: 'Gmail', desc: 'Emails relevantes' },
                { label: 'WhatsApp', desc: 'Via Twilio webhook' },
                { label: 'Web', desc: 'Scraping com Firecrawl' },
              ].map((s) => (
                <li key={s.label} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span><strong className="text-foreground">{s.label}</strong> — {s.desc}</span>
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t border-border space-y-1.5">
              <p className="text-xs">
                Endpoint: <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">POST /functions/v1/rag-ingest</code>
              </p>
              <p className="text-xs">
                Docs: <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">n8n/docs/rag-ingestion-guide.md</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-4 h-4" /> Documentos Ingeridos
              {totalDocs > 0 && <Badge variant="secondary" className="text-xs">{totalDocs}</Badge>}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar documento..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 w-[200px] text-sm"
                />
              </div>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="h-8 w-[140px] text-sm">
                  <SelectValue placeholder="Fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fontes</SelectItem>
                  {SOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando documentos...</span>
            </div>
          ) : !documents?.length ? (
            <div className="text-center py-12 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Nenhum documento ingerido</p>
                <p className="text-xs text-muted-foreground mt-1">Use o formulário acima para começar a alimentar a base de conhecimento.</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhum documento corresponde aos filtros.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead className="text-center">Chunks</TableHead>
                    <TableHead>Ingerido em</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc) => (
                    <TableRow key={doc.id} className="group">
                      <TableCell className="font-medium max-w-[300px]">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{doc.title}</span>
                          {doc.source_url && (
                            <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', SOURCE_COLORS[doc.source_type] || '')}>
                          {doc.source_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-sm">{doc.chunk_count ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground text-xs tabular-nums">
                        {format(new Date(doc.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteTarget({ id: doc.id, title: doc.title })}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento <strong>"{deleteTarget?.title}"</strong> e todos os seus chunks serão excluídos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
