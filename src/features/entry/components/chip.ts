import { cn } from "cn"

/** 選択チップの共通スタイル（カテゴリ・支払方法・日付・メモ） */
export function chipClassName(selected: boolean, className?: string) {
  return cn(
    "inline-flex h-10 shrink-0 touch-manipulation items-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap ring-1 transition-colors select-none ring-inset",
    selected
      ? "bg-primary/12 font-medium text-primary ring-primary/50"
      : "bg-card text-foreground/80 ring-border active:bg-muted",
    className
  )
}
