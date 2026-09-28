import { useQuery, type QueryClient } from "@tanstack/react-query"

import {
  sumPeriods,
  totalsRangeStart,
  type AmountOnDate,
} from "@/features/summary/aggregate"
import { todayYmd } from "@/lib/date"
import { supabase } from "@/lib/supabase"

export const transactionKeys = {
  all: ["transactions"] as const,
  totals: (householdId: string, from: string, to: string) =>
    [...transactionKeys.all, "totals", householdId, from, to] as const,
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
