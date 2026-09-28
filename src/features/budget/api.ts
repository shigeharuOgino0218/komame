import type { BudgetPeriod, BudgetRow } from "@/features/budget/current-budget"
import { startOfMonth, startOfWeek, todayYmd } from "@/lib/date"
import { supabase } from "@/lib/supabase"

export async function fetchBudgets(householdId: string): Promise<BudgetRow[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("period, effective_from, amount")
    .eq("household_id", householdId)
    .order("effective_from")
  if (error) throw error
  return data as BudgetRow[]
}

/** 今の期間から有効な予算を設定する。同じ期間の中で変えたら上書きする。null で未設定 */
export async function setBudget(
  householdId: string,
  period: BudgetPeriod,
  amount: number | null
) {
  const today = todayYmd()
  const { error } = await supabase.from("budgets").upsert(
    {
      household_id: householdId,
      period,
      effective_from:
        period === "week" ? startOfWeek(today) : startOfMonth(today),
      amount,
    },
    { onConflict: "household_id,period,effective_from" }
  )
  if (error) throw error
}

export async function fetchSavingsBalance(householdId: string) {
  const { data, error } = await supabase.rpc("savings_balance", {
    p_household_id: householdId,
  })
  if (error) throw error
  return data
}
