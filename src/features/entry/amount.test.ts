import { describe, expect, it } from "vitest"

import { appendDigit, removeLastDigit } from "@/features/entry/amount"

describe("appendDigit", () => {
  it("数字を末尾に足す", () => {
    expect(appendDigit(0, "5")).toBe(5)
    expect(appendDigit(58, "0")).toBe(580)
    expect(appendDigit(12, "00")).toBe(1200)
  })

  it("金額が 0 のとき 0 / 00 は効かない", () => {
    expect(appendDigit(0, "0")).toBe(0)
    expect(appendDigit(0, "00")).toBe(0)
  })

  it("上限 9,999,999 を超える入力は無視する", () => {
    expect(appendDigit(999_999, "9")).toBe(9_999_999)
    expect(appendDigit(9_999_999, "1")).toBe(9_999_999)
    expect(appendDigit(100_000, "00")).toBe(100_000)
  })
})

describe("removeLastDigit", () => {
  it("末尾の桁を消す", () => {
    expect(removeLastDigit(580)).toBe(58)
    expect(removeLastDigit(5)).toBe(0)
    expect(removeLastDigit(0)).toBe(0)
  })
})
