import { describe, expect, it } from "vitest"

import {
  currentBudgets,
  hasEverSetBudget,
  type BudgetRow,
} from "@/features/budget/current-budget"

describe("currentBudgets", () => {
  it("今日までに有効になった最新の行を使う", () => {
    const rows: BudgetRow[] = [
      { period: "week", effective_from: "2026-09-21", amount: 20000 },
      { period: "week", effective_from: "2026-09-14", amount: 10000 },
      { period: "month", effective_from: "2026-09-01", amount: 80000 },
      { period: "month", effective_from: "2026-10-01", amount: 90000 }, // まだ先
    ]
    expect(currentBudgets(rows, "2026-09-28")).toEqual({
      week: 20000,
      month: 80000,
    })
  })

  it("未設定に戻した行や行がない期間は null", () => {
    const rows: BudgetRow[] = [
      { period: "week", effective_from: "2026-09-21", amount: 10000 },
      { period: "week", effective_from: "2026-09-28", amount: null },
    ]
    expect(currentBudgets(rows, "2026-09-28")).toEqual({
      week: null,
      month: null,
    })
  })
})

describe("hasEverSetBudget", () => {
  it("金額のある行が1つでもあれば true", () => {
    expect(hasEverSetBudget([])).toBe(false)
    expect(
      hasEverSetBudget([
        { period: "month", effective_from: "2026-09-01", amount: null },
      ])
    ).toBe(false)
    expect(
      hasEverSetBudget([
        { period: "week", effective_from: "2026-09-21", amount: 10000 },
        { period: "week", effective_from: "2026-09-28", amount: null },
      ])
    ).toBe(true)
  })
})
