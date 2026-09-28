import { PiggyBankIcon } from "lucide-react"

import { cn } from "cn"

import { chipClassName } from "@/features/entry/components/chip"
import { formatCompactYen, formatYen } from "@/lib/money"

/** カテゴリのチップと同じ幅にして、下の列と縦に揃える */
const chipWidth = "w-[calc((100%-14px)/5.5)]"

/** 自由貯金から払うかどうか。残高が 0 以下ならオンにできない */
export function SavingsChip({
  balance,
  selected,
  insufficient,
  onToggle,
}: {
  balance: number | undefined
  selected: boolean
  /** オンで、金額が残高を超えている */
  insufficient: boolean
  onToggle: () => void
}) {
  const disabled = !selected && (balance === undefined || balance <= 0)

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`自由貯金から払う（残高 ${balance === undefined ? "不明" : formatYen(balance)}）`}
      disabled={disabled}
      className={chipClassName(
        selected,
        cn(
          "h-16 flex-col justify-center gap-1 rounded-2xl px-1 text-[11px] leading-none disabled:opacity-50",
          chipWidth
        )
      )}
      onClick={onToggle}
    >
      <PiggyBankIcon className="size-5" />
      自由貯金
      <span
        className={cn(
          "max-w-full truncate tabular-nums",
          (insufficient || (balance !== undefined && balance < 0)) &&
            "text-destructive"
        )}
      >
        {balance === undefined ? "–" : formatCompactYen(balance)}
      </span>
    </button>
  )
}
