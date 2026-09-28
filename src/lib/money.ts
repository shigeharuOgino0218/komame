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

/**
 * 狭い場所（自由貯金のチップ。360px 幅の画面で約 49px）に収まるよう、10万円以上は万、1億円以上は億で出す。
 * 端数は切り捨てる（金額を多く見せない）
 */
export function formatCompactYen(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? "-" : ""
  if (abs < 100_000) return formatYen(amount)
  if (abs < 100_000_000) {
    return `${sign}¥${formatNumber(Math.trunc(abs / 10_000))}万`
  }
  return `${sign}¥${formatNumber(Math.trunc(abs / 10_000_000) / 10)}億`
}
