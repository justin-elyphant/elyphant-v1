import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AcronymTooltipProps {
  acronym: string;
  definition: string;
  calculation?: string;
  className?: string;
}

/**
 * Inline acronym with hover/tap tooltip explaining the term and (optionally) how the number was calculated.
 * Wrap the acronym text e.g. <AcronymTooltip acronym="TAM" definition="Total Addressable Market" calculation="..." />
 */
const AcronymTooltip = ({ acronym, definition, calculation, className = '' }: AcronymTooltipProps) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={`underline decoration-dotted decoration-purple-400/60 underline-offset-2 cursor-help ${className}`}
        >
          {acronym}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs bg-gray-900 border border-white/10 text-white text-xs leading-relaxed p-3"
      >
        <div className="font-semibold text-purple-300 mb-1">{acronym} — {definition}</div>
        {calculation && (
          <div className="text-muted-foreground text-[11px] whitespace-pre-line">{calculation}</div>
        )}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default AcronymTooltip;
