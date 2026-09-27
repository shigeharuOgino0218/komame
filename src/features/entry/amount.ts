import { MAX_AMOUNT } from "@/lib/money"

export type DigitKey =
  "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "00"

/** テンキー入力。先頭の 0 は付けず、上限を超える入力は無視する */
export function appendDigit(amount: number, key: DigitKey): number {
  if (amount === 0) {
    return key === "0" || key === "00" ? 0 : Number(key)
  }
  const next = Number(`${amount}${key}`)
  return next > MAX_AMOUNT ? amount : next
}

export function removeLastDigit(amount: number): number {
  return Math.floor(amount / 10)
}
