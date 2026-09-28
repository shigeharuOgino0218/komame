import { cn } from "cn"

import { formatNumber } from "@/lib/money"

export function AmountDisplay({ amount }: { amount: number }) {
  return (
    <output
      aria-live="polite"
      aria-label={`金額 ${amount} 円`}
      className={cn(
        "flex items-baseline justify-end gap-1.5 font-semibold tabular-nums",
        amount === 0 && "text-muted-foreground/50"
      )}
    >
      <span className="text-2xl">¥</span>
      <span className="text-5xl tracking-tight">{formatNumber(amount)}</span>
    </output>
  )
}
