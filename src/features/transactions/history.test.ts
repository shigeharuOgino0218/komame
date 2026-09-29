import { describe, expect, it } from "vitest"

import {
  afterCursorFilter,
  compareHistory,
  groupByDay,
  HISTORY_PAGE_SIZE,
  nextCursor,
  removeFromPages,
  restoreToPages,
  type HistoryItem,
} from "@/features/transactions/history"

function item(
  id: string,
  occurred_on: string,
  created_at: string,
  amount = 100
): HistoryItem {
  return {
    id,
    household_id: "h",
    amount,
    occurred_on,
    created_at,
    memo: null,
    funding: "budget",
    category_id: null,
    payment_method_id: null,
    category: null,
    payment_method: null,
  }
}

describe("compareHistory", () => {
  it("利用日 → 記録日時 → id の新しい順", () => {
    const rows = [
      item("a", "2026-09-28", "2026-09-29T01:00:00+00:00"),
      item("b", "2026-09-29", "2026-09-29T00:00:00+00:00"),
      item("c", "2026-09-29", "2026-09-29T02:00:00+00:00"),
      item("d", "2026-09-29", "2026-09-29T02:00:00+00:00"),
    ]
    expect(rows.sort(compareHistory).map((row) => row.id)).toEqual([
      "d",
      "c",
      "b",
      "a",
    ])
  })
})

describe("afterCursorFilter", () => {
  it("記録日時は引用符で囲む", () => {
    expect(
      afterCursorFilter({
        occurred_on: "2026-09-29",
        created_at: "2026-09-29T01:02:03.456+00:00",
        id: "x",
      })
    ).toBe(
      'occurred_on.lt.2026-09-29,and(occurred_on.eq.2026-09-29,created_at.lt."2026-09-29T01:02:03.456+00:00"),and(occurred_on.eq.2026-09-29,created_at.eq."2026-09-29T01:02:03.456+00:00",id.lt.x)'
    )
  })
})

describe("nextCursor", () => {
  it("ページが埋まっていれば最後の行、足りなければ終わり", () => {
    const full = Array.from({ length: HISTORY_PAGE_SIZE }, (_, i) =>
      item(`${i}`, "2026-09-29", "2026-09-29T00:00:00+00:00")
    )
    expect(nextCursor(full)).toEqual({
      occurred_on: "2026-09-29",
      created_at: "2026-09-29T00:00:00+00:00",
      id: `${HISTORY_PAGE_SIZE - 1}`,
    })
    expect(nextCursor(full.slice(1))).toBeUndefined()
  })
})

describe("groupByDay", () => {
  it("日ごとにまとめて合計する", () => {
    const days = groupByDay([
      item("a", "2026-09-29", "2026-09-29T02:00:00+00:00", 300),
      item("b", "2026-09-29", "2026-09-29T01:00:00+00:00", 200),
      item("c", "2026-09-27", "2026-09-27T01:00:00+00:00", 100),
    ])
    expect(
      days.map(({ date, total, items }) => ({
        date,
        total,
        ids: items.map((row) => row.id),
      }))
    ).toEqual([
      { date: "2026-09-29", total: 500, ids: ["a", "b"] },
      { date: "2026-09-27", total: 100, ids: ["c"] },
    ])
  })

  it("行がなければ空", () => {
    expect(groupByDay([])).toEqual([])
  })
})

describe("removeFromPages / restoreToPages", () => {
  const a = item("a", "2026-09-29", "2026-09-29T02:00:00+00:00")
  const b = item("b", "2026-09-28", "2026-09-28T02:00:00+00:00")
  const c = item("c", "2026-09-27", "2026-09-27T02:00:00+00:00")

  it("消した行を元の位置に戻す", () => {
    const removed = removeFromPages([[a, b], [c]], "b")
    expect(removed).toEqual([[a], [c]])
    expect(restoreToPages(removed, b)).toEqual([[a, b], [c]])
  })

  it("最後の行も戻せる", () => {
    expect(restoreToPages([[a, b]], c)).toEqual([[a, b, c]])
  })

  it("読み込み済みの範囲より後ろの行は差し込まない", () => {
    const full = Array.from({ length: HISTORY_PAGE_SIZE }, () => a)
    expect(restoreToPages([full], c)).toEqual([full])
  })
})
