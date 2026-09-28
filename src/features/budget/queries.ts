import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"

import {
  fetchBudgets,
  fetchSavingsBalance,
  setBudget,
} from "@/features/budget/api"
import type { BudgetPeriod } from "@/features/budget/current-budget"

export const budgetKeys = {
  budgets: (householdId: string) => ["budgets", householdId] as const,
  savingsBalanceAll: ["savings-balance"] as const,
  savingsBalance: (householdId: string) =>
    [...budgetKeys.savingsBalanceAll, householdId] as const,
}

export function useBudgets(householdId: string | undefined) {
  return useQuery({
    queryKey: budgetKeys.budgets(householdId!),
    queryFn: () => fetchBudgets(householdId!),
    enabled: householdId !== undefined,
  })
}

export function useSavingsBalance(
  householdId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: budgetKeys.savingsBalance(householdId!),
    queryFn: () => fetchSavingsBalance(householdId!),
    enabled: householdId !== undefined && enabled,
  })
}

export function useSetBudget(householdId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      period,
      amount,
    }: {
      period: BudgetPeriod
      amount: number | null
    }) => setBudget(householdId!, period, amount),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: budgetKeys.budgets(householdId!),
        }),
        queryClient.invalidateQueries({
          queryKey: budgetKeys.savingsBalanceAll,
        }),
      ]),
  })
}

/** 貯金から払った直後に残高へ即反映する（サーバー応答を待たない） */
export function adjustSavingsBalanceCache(
  queryClient: QueryClient,
  delta: number
) {
  queryClient.setQueriesData<number>(
    { queryKey: budgetKeys.savingsBalanceAll },
    (balance) => (balance === undefined ? balance : balance + delta)
  )
}
