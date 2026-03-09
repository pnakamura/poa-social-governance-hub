import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HELP_CONTENT } from '@/data/help-content'

type Props = {
  id: string
  className?: string
}

export function HelpTooltip({ id, className }: Props) {
  const entry = HELP_CONTENT[id]
  if (!entry) return null

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-help ${className ?? ''}`}
            aria-label={`Ajuda: ${entry.title}`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs p-3 text-left"
        >
          <p className="font-semibold text-sm mb-1">{entry.title}</p>
          <p className="text-xs text-muted-foreground leading-snug">{entry.description}</p>
          {entry.link && (
            <a
              href={entry.link}
              className="mt-2 block text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {entry.linkLabel ?? 'Ver mais'} →
            </a>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
