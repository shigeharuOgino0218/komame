import { PencilLineIcon } from "lucide-react"

import { cn } from "cn"

/** チップの見た目をした1行入力。タップで直接フォーカスされるため iOS でもキーボードが開く */
export function MemoField({
  value,
  onChange,
}: {
  value: string
  onChange: (memo: string) => void
}) {
  return (
    <label
      className={cn(
        "flex h-10 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-card px-3.5 ring-1 ring-border transition-colors ring-inset focus-within:ring-primary/50",
        value && "bg-primary/12 ring-primary/50"
      )}
    >
      <PencilLineIcon
        className={cn(
          "size-4 shrink-0 text-foreground/60",
          value && "text-primary"
        )}
      />
      <input
        type="text"
        value={value}
        maxLength={200}
        placeholder="メモ"
        enterKeyHint="done"
        aria-label="メモ（任意）"
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-foreground/60"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
        }}
      />
    </label>
  )
}
