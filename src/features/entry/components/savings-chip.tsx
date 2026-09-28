import { PiggyBankIcon } from "lucide-react"

import { cn } from "cn"

import { chipClassName } from "@/features/entry/components/chip"
import { formatYen } from "@/lib/money"

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
      disabled={disabled}
      className={chipClassName(selected, "disabled:opacity-50")}
      onClick={onToggle}
    >
      <PiggyBankIcon className="size-4" />
      自由貯金
      <span
        className={cn(
          "tabular-nums",
          (insufficient || (balance !== undefined && balance < 0)) &&
            "text-destructive"
        )}
      >
        {balance === undefined ? "–" : formatYen(balance)}
      </span>
    </button>
  )
}
