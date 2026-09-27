import { startOfMonth, startOfWeek, type Ymd } from "@/lib/date"

export type AmountOnDate = { amount: number; occurred_on: Ymd }

export type PeriodTotals = { today: number; week: number; month: number }

/** 今日・今週（月曜始まり）・今月の合計を求めるのに必要な取得開始日 */
export function totalsRangeStart(today: Ymd): Ymd {
  const week = startOfWeek(today)
  const month = startOfMonth(today)
  return week < month ? week : month
}

export function sumPeriods(rows: AmountOnDate[], today: Ymd): PeriodTotals {
  const weekStart = startOfWeek(today)
  const monthStart = startOfMonth(today)
  const totals: PeriodTotals = { today: 0, week: 0, month: 0 }

  for (const { amount, occurred_on } of rows) {
    if (occurred_on > today) continue
    if (occurred_on === today) totals.today += amount
    if (occurred_on >= weekStart) totals.week += amount
    if (occurred_on >= monthStart) totals.month += amount
  }
  return totals
}
