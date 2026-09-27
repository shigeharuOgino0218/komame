import { describe, expect, it } from "vitest"

import { sumPeriods, totalsRangeStart } from "@/features/summary/aggregate"

describe("totalsRangeStart", () => {
  it("週初と月初の早い方", () => {
    expect(totalsRangeStart("2026-09-27")).toBe("2026-09-01")
    expect(totalsRangeStart("2026-10-01")).toBe("2026-09-28") // 週が前月から始まる
  })
})

describe("sumPeriods", () => {
  it("今日・今週・今月に振り分ける（週をまたぐ月初）", () => {
    const today = "2026-10-02" // 金曜。週は 9/28(月) から
    const rows = [
      { amount: 100, occurred_on: "2026-10-02" }, // 今日
      { amount: 200, occurred_on: "2026-10-01" }, // 今週・今月
      { amount: 400, occurred_on: "2026-09-29" }, // 今週だけ（先月）
      { amount: 800, occurred_on: "2026-09-27" }, // どれでもない
    ]
    expect(sumPeriods(rows, today)).toEqual({
      today: 100,
      week: 700,
      month: 300,
    })
  })

  it("行がなければ 0", () => {
    expect(sumPeriods([], "2026-09-27")).toEqual({
      today: 0,
      week: 0,
      month: 0,
    })
  })
})
