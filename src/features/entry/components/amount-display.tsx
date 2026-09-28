import type * as React from "react"

import { cn } from "cn"

import { formatNumber } from "@/lib/money"

/**
 * 数字1文字の幅の見積もり（em）。カンマも数字として数えるので実際より少し広めになる。
 * 置いた場所の幅（コンテナ）に収まらない桁数のときだけ文字を小さくする
 */
const CHAR_EM = 0.62

export function AmountDisplay({ amount }: { amount: number }) {
  const formatted = formatNumber(amount)

  return (
    <div className="@container min-w-0 flex-1">
      <output
        aria-live="polite"
        aria-label={`金額 ${amount} 円`}
        style={
          { "--amount-em": formatted.length * CHAR_EM } as React.CSSProperties
        }
        className={cn(
          "flex items-baseline justify-end gap-1.5 font-semibold tabular-nums",
          amount === 0 && "text-muted-foreground/50"
        )}
      >
        <span className="text-2xl">¥</span>
        {/* 最大 3rem（text-5xl）。「¥」と間隔の分（約 1.75rem）を除いた幅に収める */}
        <span className="text-[length:min(3rem,calc((100cqw-1.75rem)/var(--amount-em)))] leading-none tracking-tight">
          {formatted}
        </span>
      </output>
    </div>
  )
}
