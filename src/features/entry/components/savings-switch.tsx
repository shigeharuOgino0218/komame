import { cn } from "cn"

import { Switch } from "@/components/ui/switch"
import { formatCompactYen, formatYen } from "@/lib/money"

/**
 * 自由貯金から払うかどうか。文字の部分をタップしても切り替わる。
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
        "flex shrink-0 touch-manipulation items-center gap-2 select-none",
        disabled && "opacity-50"
      )}
    >
      <span className="flex flex-col gap-1 leading-none">
        <span className="text-xs text-muted-foreground">貯金を使う</span>
        <span
          aria-label={
            balance === undefined ? undefined : `残高 ${formatYen(balance)}`
          }
          className={cn(
            "text-sm font-medium tabular-nums",
            (insufficient || (balance !== undefined && balance < 0)) &&
              "text-destructive"
          )}
        >
          {balance === undefined ? "–" : formatCompactYen(balance)}
        </span>
      </span>
      <Switch
        size="sm"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onToggle}
      />
    </label>
  )
}
