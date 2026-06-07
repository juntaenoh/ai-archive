const TOOL_STYLES: Record<string, string> = {
  Claude: 'bg-amber-950 text-amber-300 border-amber-800',
  Cursor: 'bg-blue-950 text-blue-300 border-blue-800',
  'ChatGPT': 'bg-emerald-950 text-emerald-300 border-emerald-800',
  Figma: 'bg-purple-950 text-purple-300 border-purple-800',
  Midjourney: 'bg-pink-950 text-pink-300 border-pink-800',
  'v0': 'bg-slate-800 text-slate-200 border-slate-600',
  Gemini: 'bg-sky-950 text-sky-300 border-sky-800',
}

const DEFAULT_STYLE = 'bg-zinc-800 text-zinc-300 border-zinc-700'

type Props = { name: string }

export default function AiToolBadge({ name }: Props) {
  const style = TOOL_STYLES[name] ?? DEFAULT_STYLE
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono ${style}`}>
      {name}
    </span>
  )
}
