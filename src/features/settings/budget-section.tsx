import * as React from "react"
import { toast } from "sonner"

import { cn } from "cn"

import {
  currentBudgets,
  hasEverSetBudget,
  type BudgetPeriod,
} from "@/features/budget/current-budget"
import {
  useBudgets,
  useSavingsBalance,
  useSetBudget,
} from "@/features/budget/queries"
import { useHouseholdId } from "@/features/masters/queries"
import { todayYmd } from "@/lib/date"
import { formatNumber, formatYen, MAX_AMOUNT } from "@/lib/money"

const PERIODS: { period: BudgetPeriod; label: string }[] = [
  { period: "week", label: "週（月曜〜日曜）" },
  { period: "month", label: "月" },
]

export function BudgetSection() {
  const householdId = useHouseholdId()
  const { data: rows } = useBudgets(householdId)
  const everSet = rows !== undefined && hasEverSetBudget(rows)
  const { data: balance } = useSavingsBalance(householdId, { enabled: everSet })
  const setBudget = useSetBudget(householdId)
  const current = rows && currentBudgets(rows, todayYmd())
  // 保存に失敗したら入力を元の値に戻す
  const [failures, setFailures] = React.useState(0)

  const commit = (period: BudgetPeriod, amount: number | null) => {
    if (current === undefined || current[period] === amount) return
    setBudget.mutate(
      { period, amount },
      {
        onError: () => {
          setFailures((count) => count + 1)
          toast.error("予算を保存できませんでした")
        },
      }
    )
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-xs text-muted-foreground">予算</h2>
      <div className="flex flex-col divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/60">
        {PERIODS.map(({ period, label }) => (
          <BudgetInput
            // 保存後やほかの端末での変更を反映するため、値が変わったら入力をやり直す
            key={`${period}:${current?.[period] ?? ""}:${failures}`}
            label={label}
            value={current?.[period] ?? null}
            disabled={current === undefined}
            onCommit={(amount) => commit(period, amount)}
          />
        ))}
        {everSet && (
          <div className="flex h-12 items-center justify-between px-4">
            <span className="text-sm">自由貯金</span>
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                balance !== undefined && balance < 0 && "text-destructive"
              )}
            >
              {balance === undefined ? "–" : formatYen(balance)}
            </span>
          </div>
        )}
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        空欄にすると未設定になります。使い切らなかった分は自由貯金に貯まります
      </p>
    </section>
  )
}

function BudgetInput({
  label,
  value,
  disabled,
  onCommit,
}: {
  label: string
  value: number | null
  disabled: boolean
  onCommit: (amount: number | null) => void
}) {
  const [digits, setDigits] = React.useState(value === null ? "" : `${value}`)

  return (
    <label className="flex h-12 items-center gap-3 px-4">
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-sm text-muted-foreground">¥</span>
      <input
        type="text"
        inputMode="numeric"
        enterKeyHint="done"
        placeholder="未設定"
        disabled={disabled}
        value={digits === "" ? "" : formatNumber(Number(digits))}
        className="h-full w-28 bg-transparent text-right text-base tabular-nums outline-none placeholder:text-muted-foreground"
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "").replace(/^0+/, "")
          if (Number(next) <= MAX_AMOUNT) setDigits(next)
        }}
        onBlur={() => onCommit(digits === "" ? null : Number(digits))}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
        }}
      />
    </label>
  )
}
