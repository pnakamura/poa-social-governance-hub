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
import { toast } from 'sonner'
import { Upload, Trash2, FileText, BookOpen, Loader2, ExternalLink, Info } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
      // Delete chunks first, then document
      await supabase.from('rag_chunks').delete().eq('document_id', docId)
      const { error } = await supabase.from('rag_documents').delete().eq('id', docId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Documento excluído')
      queryClient.invalidateQueries({ queryKey: ['rag_documents'] })
    },
    onError: (err) => toast.error(`Erro ao excluir: ${err.message}`),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Base de Conhecimento</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ingira documentos para alimentar o assistente RAG com informações do programa.
        </p>
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
              className={`space-y-2 ${isDragging ? 'ring-2 ring-primary rounded-lg' : ''}`}
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
              <div className="flex items-center gap-2">
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
                <span className="text-xs text-muted-foreground">
                  {content.length > 0 ? `${content.length.toLocaleString()} caracteres` : ''}
                </span>
              </div>
            </div>

            <Button
              onClick={() => ingestMutation.mutate()}
              disabled={!title || !content || ingestMutation.isPending}
              className="w-full sm:w-auto"
            >
              {ingestMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Ingerir Documento
            </Button>
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
            <p className="text-xs pt-2 border-t border-border">
              Endpoint: <code className="text-[10px] bg-muted px-1 py-0.5 rounded">POST /functions/v1/rag-ingest</code>
            </p>
            <p className="text-xs">
              Consulte a documentação em <code className="text-[10px] bg-muted px-1 py-0.5 rounded">n8n/docs/rag-ingestion-guide.md</code>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4" /> Documentos Ingeridos
            {documents && <Badge variant="secondary" className="text-xs">{documents.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !documents?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum documento ingerido ainda. Use o formulário acima para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead className="text-center">Chunks</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {doc.title}
                      {doc.source_url && (
                        <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="ml-1 inline-block">
                          <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={SOURCE_COLORS[doc.source_type] || ''}>
                        {doc.source_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{doc.chunk_count ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(doc.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
