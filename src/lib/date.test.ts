import { describe, expect, it } from "vitest"

import {
  addDays,
  formatDateLabel,
  formatDateTime,
  startOfMonth,
  startOfWeek,
  todayYmd,
} from "@/lib/date"

describe("todayYmd", () => {
  it("UTC ではなく JST の日付を返す", () => {
    // 2026-09-27 14:59:59 UTC = 23:59:59 JST
    expect(todayYmd(new Date("2026-09-27T14:59:59Z"))).toBe("2026-09-27")
    // 2026-09-27 15:00:00 UTC = 翌 0:00 JST
    expect(todayYmd(new Date("2026-09-27T15:00:00Z"))).toBe("2026-09-28")
  })
})

describe("addDays", () => {
  it("月・年をまたぐ", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01")
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31")
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29")
  })
})

describe("startOfWeek", () => {
  it("月曜始まり", () => {
    expect(startOfWeek("2026-09-27")).toBe("2026-09-21") // 日曜 → 前の月曜
    expect(startOfWeek("2026-09-21")).toBe("2026-09-21") // 月曜はそのまま
    expect(startOfWeek("2026-10-01")).toBe("2026-09-28") // 月をまたぐ
  })
})

describe("startOfMonth", () => {
  it("月初を返す", () => {
    expect(startOfMonth("2026-09-27")).toBe("2026-09-01")
  })
})

describe("formatDateLabel", () => {
  const today = "2026-09-27"
  it("近い日は相対表記", () => {
    expect(formatDateLabel("2026-09-27", today)).toBe("今日")
    expect(formatDateLabel("2026-09-26", today)).toBe("昨日")
    expect(formatDateLabel("2026-09-25", today)).toBe("一昨日")
  })
  it("それ以前は月/日(曜)、年が違えば年も付ける", () => {
    expect(formatDateLabel("2026-09-24", today)).toBe("9/24(木)")
    expect(formatDateLabel("2025-12-31", today)).toBe("2025/12/31(水)")
  })
})

describe("formatDateTime", () => {
  it("JST で表示する", () => {
    expect(formatDateTime("2026-09-28T15:05:00+00:00")).toBe("2026/9/29 00:05")
  })
})
