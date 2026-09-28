import type { Ymd } from "@/lib/date"

export type BudgetPeriod = "week" | "month"

/** budgets の1行。amount が null なら、その期間から未設定 */
export type BudgetRow = {
  period: BudgetPeriod
  effective_from: Ymd
  amount: number | null
}

export type CurrentBudgets = { week: number | null; month: number | null }

/** 今日の時点で有効な週・月の予算（未設定は null） */
export function currentBudgets(rows: BudgetRow[], today: Ymd): CurrentBudgets {
  const latest = (period: BudgetPeriod) =>
    rows
      .filter((row) => row.period === period && row.effective_from <= today)
      .reduce<BudgetRow | undefined>(
        (found, row) =>
          found && found.effective_from > row.effective_from ? found : row,
        undefined
      )?.amount ?? null

  return { week: latest("week"), month: latest("month") }
}

/** 一度でも予算を設定したことがあるか（自由貯金のチップを出すかどうか） */
export function hasEverSetBudget(rows: BudgetRow[]): boolean {
  return rows.some((row) => row.amount !== null)
}
