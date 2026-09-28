/** 入力できる金額の上限（円） */
export const MAX_AMOUNT = 9_999_999

const yenFormatter = new Intl.NumberFormat("ja-JP")

/** ¥1,234 / -¥1,234（予算の超過や貯金のマイナス） */
export function formatYen(amount: number): string {
  const sign = amount < 0 ? "-" : ""
  return `${sign}¥${yenFormatter.format(Math.abs(amount))}`
}

export function formatNumber(amount: number): string {
  return yenFormatter.format(amount)
}
