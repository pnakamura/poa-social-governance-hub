import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  error?: boolean
}

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'assistant',
  content: 'Olá! Sou o assistente de dados do POA+SOCIAL BID. Posso responder perguntas sobre PEP, riscos, aquisições, indicadores PMR e muito mais. Como posso ajudar?',
}

const SESSION_KEY = 'poa-chat-messages'

function loadMessages(): Message[] {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return [INITIAL_MESSAGE]
}

function saveMessages(msgs: Message[]) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(msgs)) } catch { /* ignore */ }
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open, messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const webhookUrl = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL
      || 'https://dvqnlnxkwcrxbctujajl.supabase.co/functions/v1/n8n-chat-webhook'

    if (!webhookUrl) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Assistente não configurado. Defina VITE_N8N_CHAT_WEBHOOK_URL no .env.',
        error: true,
      }])
      setLoading(false)
      return
    }

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, timestamp: new Date().toISOString() }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const answer = data.answer ?? data.output ?? data.text ?? JSON.stringify(data)

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer,
        sources: data.sources ?? [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Não foi possível conectar ao assistente. Verifique se o n8n está rodando e tente novamente.',
        error: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  function clearMessages() {
    const reset = [INITIAL_MESSAGE]
    setMessages(reset)
    saveMessages(reset)
  }

  return (
    <>
      {/* Floating Action Button */}
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
          'fixed bottom-20 right-6 z-40 w-80 md:w-96',
          'flex flex-col rounded-xl shadow-2xl border border-border/60 glass-card',
          'transition-all duration-300 ease-in-out',
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none',
        )}
        style={{ maxHeight: 'min(520px, calc(100vh - 120px))' }}
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
                <span className="text-[10px] text-muted-foreground">online</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearMessages}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Limpar conversa"
            aria-label="Limpar conversa"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0 overflow-hidden px-3 py-3">
          <div className="flex flex-col gap-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                {/* Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full gradient-bid flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-white">BID</span>
                  </div>
                )}

                {/* Bubble */}
                <div className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : msg.error
                      ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm'
                      : 'bg-muted text-foreground rounded-tl-sm',
                )}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {msg.sources.map((src, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {src}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
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
        </ScrollArea>

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-3 border-t border-border/50 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Digite sua pergunta..."
            disabled={loading}
            className={cn(
              'flex-1 text-sm bg-muted/50 border border-border/60 rounded-lg px-3 py-2',
              'placeholder:text-muted-foreground/60 text-foreground',
              'focus:outline-none focus:ring-1 focus:ring-primary/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            aria-label="Mensagem para o assistente"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="h-8 w-8 rounded-lg gradient-bid text-white flex-shrink-0 hover:opacity-90"
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
