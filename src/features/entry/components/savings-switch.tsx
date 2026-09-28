import { cn } from "cn"

import { Switch } from "@/components/ui/switch"
import { formatYen } from "@/lib/money"

/**
 * 自由貯金から払うかどうか。行のどこをタップしても切り替わる。
 * 残高が 0 以下ならオンにできない
 */
export function SavingsSwitch({
  balance,
  checked,
  insufficient,
  onToggle,
}: {
  balance: number | undefined
  checked: boolean
  /** オンで、金額が残高を超えている */
  insufficient: boolean
  onToggle: () => void
}) {
  const disabled = !checked && (balance === undefined || balance <= 0)

  return (
    <label
      className={cn(
        "flex h-10 touch-manipulation items-center gap-2 border-t text-sm transition-colors select-none"
      )}
    >
      貯金を使う
      <span
        className={cn(
          "text-primary tabular-nums",
          (insufficient || (balance !== undefined && balance < 0)) &&
            "text-destructive"
        )}
      >
        {balance === undefined ? "–" : formatYen(balance)}
      </span>
      <Switch
        className="ml-auto"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onToggle}
      />
    </label>
  )
}
