import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query"

import {
  sumPeriods,
  totalsRangeStart,
  type AmountOnDate,
} from "@/features/summary/aggregate"
import {
  afterCursorFilter,
  HISTORY_PAGE_SIZE,
  nextCursor,
  type HistoryCursor,
  type HistoryItem,
} from "@/features/transactions/history"
import { todayYmd } from "@/lib/date"
import { supabase } from "@/lib/supabase"

export const transactionKeys = {
  all: ["transactions"] as const,
  totals: (householdId: string, from: string, to: string) =>
    [...transactionKeys.all, "totals", householdId, from, to] as const,
  historyAll: ["transactions", "history"] as const,
  history: (householdId: string) =>
    [...transactionKeys.historyAll, householdId] as const,
}

type TotalsRow = AmountOnDate & { id: string }

export function useExpenseTotals(householdId: string | undefined) {
  const today = todayYmd()
  const from = totalsRangeStart(today)

  return useQuery({
    queryKey: transactionKeys.totals(householdId!, from, today),
    queryFn: async (): Promise<TotalsRow[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, occurred_on")
        .eq("household_id", householdId!)
        .eq("type", "expense")
        // 自由貯金から払った支出は予算の外なので合計に含めない
        .eq("funding", "budget")
        .gte("occurred_on", from)
        .lte("occurred_on", today)
      if (error) throw error
      return data
    },
    enabled: householdId !== undefined,
    select: (rows) => sumPeriods(rows, today),
  })
}

/** 保存直後に合計へ即反映する（サーバー応答を待たない） */
export function addToTotalsCache(queryClient: QueryClient, row: TotalsRow) {
  queryClient.setQueriesData<TotalsRow[]>(
    { queryKey: [...transactionKeys.all, "totals"] },
    (rows) => rows && [...rows, row]
  )
}

export function removeFromTotalsCache(queryClient: QueryClient, id: string) {
  queryClient.setQueriesData<TotalsRow[]>(
    { queryKey: [...transactionKeys.all, "totals"] },
    (rows) => rows?.filter((row) => row.id !== id)
  )
}

/** 世帯の支出を新しい順に。カテゴリ・支払方法はアーカイブ済みでも名前を出すため JOIN で取る */
export function useHistory(householdId: string | undefined) {
  return useInfiniteQuery({
    queryKey: transactionKeys.history(householdId!),
    queryFn: async ({ pageParam }): Promise<HistoryItem[]> => {
      let query = supabase
        .from("transactions")
        .select(
          "id, household_id, amount, occurred_on, created_at, memo, funding, category_id, payment_method_id, category:categories(name, icon), payment_method:payment_methods(name, icon)"
        )
        .eq("household_id", householdId!)
        .eq("type", "expense")
      if (pageParam) query = query.or(afterCursorFilter(pageParam))
      const { data, error } = await query
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(HISTORY_PAGE_SIZE)
      if (error) throw error
      return data
    },
    initialPageParam: undefined as HistoryCursor | undefined,
    getNextPageParam: nextCursor,
    enabled: householdId !== undefined,
  })
}

/** 読み込み済みの履歴を書き換える（削除・取り消しの即時反映） */
export function updateHistoryCache(
  queryClient: QueryClient,
  update: (pages: HistoryItem[][]) => HistoryItem[][]
) {
  queryClient.setQueriesData<InfiniteData<HistoryItem[], unknown>>(
    { queryKey: transactionKeys.historyAll },
    (data) => data && { ...data, pages: update(data.pages) }
  )
}
