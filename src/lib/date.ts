/**
 * 日付は "YYYY-MM-DD"（Ymd）文字列で扱い、「今日」は常に JST で決める。
 * DB の transactions.occurred_on（date 型）と同じ表現。
 */
export const APP_TIME_ZONE = "Asia/Tokyo"

export type Ymd = string

const ymdPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const

export function todayYmd(now: Date = new Date()): Ymd {
  const parts = ymdPartsFormatter.formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value
  return `${get("year")}-${get("month")}-${get("day")}`
}

function toUtcDate(ymd: Ymd): Date {
  const [year, month, day] = ymd.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function fromUtcDate(date: Date): Ymd {
  return date.toISOString().slice(0, 10)
}

export function addDays(ymd: Ymd, days: number): Ymd {
  const date = toUtcDate(ymd)
  date.setUTCDate(date.getUTCDate() + days)
  return fromUtcDate(date)
}

export function diffDays(from: Ymd, to: Ymd): number {
  return Math.round(
    (toUtcDate(to).getTime() - toUtcDate(from).getTime()) / 86_400_000
  )
}

/** 月曜始まりの週の初日 */
export function startOfWeek(ymd: Ymd): Ymd {
  const daysSinceMonday = (toUtcDate(ymd).getUTCDay() + 6) % 7
  return addDays(ymd, -daysSinceMonday)
}

export function startOfMonth(ymd: Ymd): Ymd {
  return `${ymd.slice(0, 7)}-01`
}

/** 今日 / 昨日 / 一昨日 / 9/24(水) / 2025/12/31(水) */
export function formatDateLabel(ymd: Ymd, today: Ymd = todayYmd()): string {
  const daysAgo = diffDays(ymd, today)
  if (daysAgo === 0) return "今日"
  if (daysAgo === 1) return "昨日"
  if (daysAgo === 2) return "一昨日"

  const [year, month, day] = ymd.split("-").map(Number)
  const weekday = WEEKDAYS[toUtcDate(ymd).getUTCDay()]
  const monthDay = `${month}/${day}(${weekday})`
  return year === Number(today.slice(0, 4)) ? monthDay : `${year}/${monthDay}`
}
