import { cn } from "cn"

import { BrandMark } from "@/components/brand-mark"
import { SettingsLink } from "@/components/settings-link"
import { currentBudgets } from "@/features/budget/current-budget"
import { useBudgets } from "@/features/budget/queries"
import { useExpenseTotals } from "@/features/transactions/queries"
import { todayYmd } from "@/lib/date"
import { formatYen } from "@/lib/money"

export function TotalsHeader({ householdId }: { householdId?: string }) {
  const { data } = useExpenseTotals(householdId)
  const { data: budgetRows } = useBudgets(householdId)
  const budgets = budgetRows && currentBudgets(budgetRows, todayYmd())

  // 予算がある期間は「あといくら使えるか」を出す
  const period = (label: string, spent?: number, budget?: number | null) =>
    budget == null
      ? { label, value: spent }
      : {
          label: `${label} 残り`,
          value: spent === undefined ? undefined : budget - spent,
        }

  const items = [
    { label: "今日", value: data?.today },
    period("今週", data?.week, budgets?.week),
    period("今月", data?.month, budgets?.month),
  ]

  return (
    <header className="flex h-12 items-center gap-2">
      <BrandMark className="size-6 shrink-0" />
      <dl className="ml-auto flex gap-4">
        {items.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-end">
            <dt className="text-[10px] leading-4 text-muted-foreground">
              {label}
            </dt>
            <dd
              className={cn(
                "text-sm leading-5 font-medium tabular-nums",
                value !== undefined && value < 0 && "text-destructive"
              )}
            >
              {value === undefined ? "–" : formatYen(value)}
            </dd>
          </div>
        ))}
      </dl>
      <SettingsLink className="-mr-2 shrink-0" />
    </header>
  )
}
