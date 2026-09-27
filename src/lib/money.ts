/** 入力できる金額の上限（円） */
export const MAX_AMOUNT = 9_999_999

const yenFormatter = new Intl.NumberFormat("ja-JP")

export function formatYen(amount: number): string {
  return `¥${yenFormatter.format(amount)}`
}

export function formatNumber(amount: number): string {
  return yenFormatter.format(amount)
}
