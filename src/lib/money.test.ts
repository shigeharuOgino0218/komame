import { describe, expect, it } from "vitest"

import { formatYen } from "@/lib/money"

describe("formatYen", () => {
  it("マイナスは符号を ¥ の前に付ける", () => {
    expect(formatYen(1_234)).toBe("¥1,234")
    expect(formatYen(0)).toBe("¥0")
    expect(formatYen(-12_000)).toBe("-¥12,000")
  })
})
