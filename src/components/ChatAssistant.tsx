import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send, Loader2, SquarePen, FileText, Mail, MessageCircle, Globe, Database, ArrowDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface Source {
  title: string
  type: string
  url?: string | null
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  error?: boolean
  timestamp: number
}

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'assistant',
  content: 'Olá! Sou o assistente de dados do **POA+SOCIAL BID**. Posso responder perguntas sobre PEP, riscos, aquisições, indicadores PMR e documentos do programa. Como posso ajudar?',
  timestamp: Date.now(),
}

const QUICK_PROMPTS = [
  'Resumo do PEP',
  'Riscos críticos',
  'Status das aquisições',
  'Indicadores PMR',
]

const SESSION_KEY = 'poa-chat-messages'
const CONVERSATION_KEY = 'poa-chat-conversation-id'

function loadMessages(): Message[] {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      const msgs = JSON.parse(stored) as Message[]
      // migrate old messages without timestamp
      return msgs.map(m => ({ ...m, timestamp: m.timestamp ?? Date.now() }))
    }
  } catch { /* ignore */ }
  return [INITIAL_MESSAGE]
}

function saveMessages(msgs: Message[]) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(msgs)) } catch { /* ignore */ }
}

const SOURCE_ICONS: Record<string, typeof FileText> = {
  google_drive: FileText,
  gmail: Mail,
  whatsapp: MessageCircle,
  web: Globe,
  database: Database,
  manual: FileText,
}

const SOURCE_LABELS: Record<string, string> = {
  google_drive: 'Drive',
  gmail: 'Gmail',
  whatsapp: 'WhatsApp',
  web: 'Web',
  database: 'BD',
  manual: 'Doc',
}

function SourceBadge({ source }: { source: Source }) {
  const Icon = SOURCE_ICONS[source.type] || FileText
  const label = SOURCE_LABELS[source.type] || source.type
  const displayTitle = source.title.length > 25 ? source.title.slice(0, 25) + '…' : source.title

  if (source.url) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-colors no-underline"
      >
        <Icon className="w-2.5 h-2.5" />
        <span>{label}: {displayTitle}</span>
      </a>
    )
  }

  return (
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
      <Icon className="w-2.5 h-2.5" />
      {label}: {displayTitle}
    </Badge>
  )
}

function MessageTimestamp({ ts }: { ts: number }) {
  return (
    <span className="text-[9px] text-muted-foreground/60 mt-0.5 select-none">
      {format(new Date(ts), 'HH:mm')}
    </span>
  )
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(
    () => sessionStorage.getItem(CONVERSATION_KEY)
  )
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isOnlyInitial = messages.length <= 1

  // persist
  useEffect(() => { saveMessages(messages) }, [messages])

  // auto-scroll on new message
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    }
  }, [open, messages.length])

  // focus textarea on open
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150)
  }, [open])

  // scroll-to-bottom button via IntersectionObserver
  useEffect(() => {
    const bottom = bottomRef.current
    const container = scrollContainerRef.current
    if (!bottom || !container) return

    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollBtn(!entry.isIntersecting),
      { root: container, threshold: 0.1 }
    )
    observer.observe(bottom)
    return () => observer.disconnect()
  }, [open])

  // auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px' // max ~4 lines
  }, [input])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: msg, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-chat`

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ message: msg, conversation_id: conversationId }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const answer = data.answer ?? data.output ?? data.text ?? JSON.stringify(data)

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id)
        sessionStorage.setItem(CONVERSATION_KEY, data.conversation_id)
      }

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer,
        sources: data.sources ?? [],
        timestamp: Date.now(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Não foi possível conectar ao assistente. Verifique a conexão e tente novamente.',
        error: true,
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function startNewConversation() {
    const reset = [{ ...INITIAL_MESSAGE, timestamp: Date.now() }]
    setMessages(reset)
    saveMessages(reset)
    setConversationId(null)
    sessionStorage.removeItem(CONVERSATION_KEY)
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg',
          'gradient-bid text-white flex items-center justify-center',
          'hover:scale-110 transition-transform duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
        aria-label="Abrir assistente de dados"
        title="Assistente de dados POA+SOCIAL"
      >
        {open
          ? <X className="w-5 h-5" aria-hidden="true" />
          : <MessageSquare className="w-5 h-5" aria-hidden="true" />}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-20 right-6 z-40 w-[360px] md:w-[440px]',
          'flex flex-col rounded-xl shadow-2xl border border-border/60 glass-card',
          'transition-all duration-300 ease-in-out',
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none',
        )}
        style={{ maxHeight: 'min(600px, calc(100vh - 120px))' }}
        role="dialog"
        aria-label="Assistente de dados"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full gradient-bid flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">BID</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">Assistente POA+SOCIAL</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
                <span className="text-[10px] text-muted-foreground">RAG • online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* New Conversation with confirmation */}
            {!isOnlyInitial ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Nova conversa"
                    aria-label="Nova conversa"
                  >
                    <SquarePen className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-xs">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base">Nova conversa?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      A conversa atual será apagada. Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="h-8 text-xs" onClick={startNewConversation}>
                      Iniciar nova
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <button
                onClick={startNewConversation}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Nova conversa"
                aria-label="Nova conversa"
              >
                <SquarePen className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-3 py-3 relative"
        >
          <div className="flex flex-col gap-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full gradient-bid flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-white">BID</span>
                  </div>
                )}

                <div className={cn(
                  'flex flex-col',
                  msg.role === 'user' ? 'items-end' : 'items-start',
                  'max-w-[85%]',
                )}>
                  <div className={cn(
                    'rounded-xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : msg.error
                        ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm'
                        : 'bg-muted text-foreground rounded-tl-sm',
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_td]:px-2 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_blockquote]:text-xs [&_blockquote]:border-primary/30">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-border/30">
                        {msg.sources.map((src, i) => (
                          <SourceBadge key={i} source={typeof src === 'string' ? { title: src, type: 'database' } : src} />
                        ))}
                      </div>
                    )}
                  </div>
                  <MessageTimestamp ts={msg.timestamp} />
                </div>
              </div>
            ))}

            {/* Quick prompts */}
            {isOnlyInitial && !loading && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {QUICK_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-background text-foreground hover:bg-muted transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full gradient-bid flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[8px] font-bold text-white">BID</span>
                </div>
                <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2.5 max-w-[85%]">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-2 w-12" />
                    <Skeleton className="h-2 w-8" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Scroll to bottom */}
          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:opacity-90 transition-opacity z-10"
              aria-label="Ir para o final"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 px-3 py-3 border-t border-border/50 flex-shrink-0">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            disabled={loading}
            rows={1}
            className={cn(
              'flex-1 text-sm bg-muted/50 border border-border/60 rounded-lg px-3 py-2 resize-none',
              'placeholder:text-muted-foreground/60 text-foreground',
              'focus:outline-none focus:ring-1 focus:ring-primary/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            style={{ maxHeight: '96px' }}
            aria-label="Mensagem para o assistente"
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="h-8 w-8 rounded-lg gradient-bid text-white flex-shrink-0 hover:opacity-90 mb-0.5"
            aria-label="Enviar mensagem"
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              : <Send className="w-3.5 h-3.5" aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </>
  )
}
