import { describe, expect, it } from "vitest"

import { formatCompactYen } from "@/lib/money"

describe("formatCompactYen", () => {
  it("10万円未満は円のまま", () => {
    expect(formatCompactYen(0)).toBe("¥0")
    expect(formatCompactYen(99_999)).toBe("¥99,999")
    expect(formatCompactYen(-12_000)).toBe("-¥12,000")
  })

  it("10万円以上は万単位で切り捨てる", () => {
    expect(formatCompactYen(100_000)).toBe("¥10万")
    expect(formatCompactYen(123_456)).toBe("¥12万")
    expect(formatCompactYen(99_999_999)).toBe("¥9,999万")
    expect(formatCompactYen(-250_000)).toBe("-¥25万")
  })

  it("1億円以上は0.1億単位で切り捨てる", () => {
    expect(formatCompactYen(100_000_000)).toBe("¥1億")
    expect(formatCompactYen(519_474_770)).toBe("¥5.1億")
  })
})
