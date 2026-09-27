import { useQuery } from "@tanstack/react-query"

import { useUserId } from "@/features/auth/auth-provider"
import { supabase } from "@/lib/supabase"

export const masterKeys = {
  profile: (userId: string) => ["profile", userId] as const,
  categories: (householdId: string) => ["categories", householdId] as const,
  paymentMethods: (householdId: string) =>
    ["payment-methods", householdId] as const,
}

export function useProfile() {
  const userId = useUserId()
  return useQuery({
    queryKey: masterKeys.profile(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, current_household_id")
        .eq("id", userId)
        .single()
      if (error) throw error
      return data
    },
    staleTime: Infinity,
  })
}

export function useHouseholdId(): string | undefined {
  return useProfile().data?.current_household_id ?? undefined
}

export function useCategories(householdId: string | undefined) {
  return useQuery({
    queryKey: masterKeys.categories(householdId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon")
        .eq("household_id", householdId!)
        .eq("kind", "expense")
        .is("archived_at", null)
        .order("sort_order")
      if (error) throw error
      return data
    },
    enabled: householdId !== undefined,
    staleTime: 5 * 60_000,
  })
}

export function usePaymentMethods(householdId: string | undefined) {
  return useQuery({
    queryKey: masterKeys.paymentMethods(householdId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("id, name, icon")
        .eq("household_id", householdId!)
        .is("archived_at", null)
        .order("sort_order")
      if (error) throw error
      return data
    },
    enabled: householdId !== undefined,
    staleTime: 5 * 60_000,
  })
}

export type Category = NonNullable<
  ReturnType<typeof useCategories>["data"]
>[number]
export type PaymentMethod = NonNullable<
  ReturnType<typeof usePaymentMethods>["data"]
>[number]
