import type { Ymd } from "@/lib/date"

export const HISTORY_PAGE_SIZE = 50

type Master = { name: string; icon: string | null }

export type HistoryItem = {
  id: string
  household_id: string
  amount: number
  occurred_on: Ymd
  created_at: string
  memo: string | null
  funding: string
  category_id: string | null
  payment_method_id: string | null
  category: Master | null
  payment_method: Master | null
}

/** 並び順（新しい順）のキー。次のページはこれより後ろから取る */
export type HistoryCursor = Pick<
  HistoryItem,
  "occurred_on" | "created_at" | "id"
>

export type HistoryDay = { date: Ymd; total: number; items: HistoryItem[] }

/** 並び順どおり a が b より前なら負 */
export function compareHistory(a: HistoryCursor, b: HistoryCursor): number {
  if (a.occurred_on !== b.occurred_on) {
    return a.occurred_on > b.occurred_on ? -1 : 1
  }
  if (a.created_at !== b.created_at) {
    return Date.parse(b.created_at) - Date.parse(a.created_at)
  }
  return a.id > b.id ? -1 : a.id < b.id ? 1 : 0
}

/** PostgREST の or フィルタ。cursor より後ろの行に絞る */
export function afterCursorFilter({
  occurred_on,
  created_at,
  id,
}: HistoryCursor): string {
  const on = `occurred_on.eq.${occurred_on}`
  const at = `created_at.eq."${created_at}"`
  return [
    `occurred_on.lt.${occurred_on}`,
    `and(${on},created_at.lt."${created_at}")`,
    `and(${on},${at},id.lt.${id})`,
  ].join(",")
}

export function nextCursor(page: HistoryItem[]): HistoryCursor | undefined {
  if (page.length < HISTORY_PAGE_SIZE) return undefined
  const { occurred_on, created_at, id } = page[page.length - 1]
  return { occurred_on, created_at, id }
}

/** 並び順どおりの行を日ごとにまとめる */
export function groupByDay(items: HistoryItem[]): HistoryDay[] {
  const days: HistoryDay[] = []
  for (const item of items) {
    const last = days[days.length - 1]
    if (last?.date === item.occurred_on) {
      last.items.push(item)
      last.total += item.amount
    } else {
      days.push({ date: item.occurred_on, total: item.amount, items: [item] })
    }
  }
  return days
}

export function removeFromPages(
  pages: HistoryItem[][],
  id: string
): HistoryItem[][] {
  return pages.map((page) => page.filter((item) => item.id !== id))
}

/**
 * 取り消しで戻す行を、読み込み済みのページの正しい位置に差し込む。
 * 読み込み済みの範囲より後ろの行は、続きを読み込んだときに出てくるので差し込まない
 */
export function restoreToPages(
  pages: HistoryItem[][],
  item: HistoryItem
): HistoryItem[][] {
  const found = pages.findIndex((page) =>
    page.some((other) => compareHistory(item, other) < 0)
  )
  // ページの先頭より前なら、前のページの末尾（元の位置）に戻す
  const index =
    found > 0 && compareHistory(item, pages[found][0]) < 0 ? found - 1 : found
  if (index === -1) {
    const last = pages.length - 1
    // 最後のページが途中で終わっている = これ以上の行はない
    if (last < 0 || pages[last].length >= HISTORY_PAGE_SIZE) return pages
    return pages.map((page, i) => (i === last ? [...page, item] : page))
  }
  return pages.map((page, i) =>
    i === index ? [...page, item].sort(compareHistory) : page
  )
}
