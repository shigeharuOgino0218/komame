import * as React from "react"
import { Link } from "react-router"

import { BrandMark } from "@/components/brand-mark"
import { PageHeader } from "@/components/page-header"
import { MasterIcon } from "@/features/masters/master-icon"
import { useHouseholdId } from "@/features/masters/queries"
import { groupByDay, type HistoryItem } from "@/features/transactions/history"
import { useHistory } from "@/features/transactions/queries"
import { formatDateLabel, todayYmd } from "@/lib/date"
import { formatYen } from "@/lib/money"

export function HistoryPage() {
  const householdId = useHouseholdId()
  const { data, isPending, isError, hasNextPage, fetchNextPage, refetch } =
    useHistory(householdId)
  const days = React.useMemo(() => groupByDay(data?.pages.flat() ?? []), [data])
  const today = todayYmd()

  return (
    <>
      <PageHeader title="履歴" />
      {isPending ? (
        <HistorySkeleton />
      ) : isError ? (
        <Message>
          読み込めませんでした
          <button
            type="button"
            className="text-primary"
            onClick={() => void refetch()}
          >
            再読み込み
          </button>
        </Message>
      ) : days.length === 0 ? (
        <Message>
          まだ記録がありません
          <Link to="/" className="text-primary">
            入力する
          </Link>
        </Message>
      ) : (
        <div className="pb-4">
          {days.map((day) => (
            <section key={day.date}>
              <h2 className="sticky top-0 z-10 flex h-8 items-center justify-between bg-background px-4 text-xs text-muted-foreground">
                <span>{formatDateLabel(day.date, today)}</span>
                <span className="tabular-nums">{formatYen(day.total)}</span>
              </h2>
              <ul>
                {day.items.map((item) => (
                  <li key={item.id}>
                    <HistoryRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {hasNextPage && <LoadMore onVisible={() => void fetchNextPage()} />}
        </div>
      )}
    </>
  )
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const sub = [item.memo, item.payment_method?.name].filter(Boolean).join("・")

  return (
    <div className="flex h-14 w-full items-center gap-3 px-4 text-left">
      <MasterIcon
        name={item.category?.icon ?? null}
        className="size-5 shrink-0 text-muted-foreground"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm">
          {item.category?.name ?? "未分類"}
        </span>
        {sub && (
          <span className="truncate text-xs text-muted-foreground">{sub}</span>
        )}
      </div>
      {item.funding === "savings" && (
        <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary">
          貯金
        </span>
      )}
      <span className="shrink-0 text-sm font-medium tabular-nums">
        {formatYen(item.amount)}
      </span>
    </div>
  )
}

/** 画面に入ったら続きを読み込む */
function LoadMore({ onVisible }: { onVisible: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const onVisibleRef = React.useRef(onVisible)
  React.useEffect(() => {
    onVisibleRef.current = onVisible
  })

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && onVisibleRef.current(),
      { rootMargin: "200px" }
    )
    observer.observe(ref.current!)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="flex h-14 items-center justify-center">
      <BrandMark className="size-5 animate-pulse text-muted-foreground/40" />
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 pt-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-12 rounded-xl bg-muted" />
      ))}
    </div>
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-24 text-center text-sm text-muted-foreground">
      <BrandMark className="size-8 text-muted-foreground/40" />
      {children}
    </div>
  )
}
