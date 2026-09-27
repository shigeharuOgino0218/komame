import type { TablesInsert } from "@/lib/database.types"
import { supabase } from "@/lib/supabase"

export type NewTransaction = Required<
  Pick<
    TablesInsert<"transactions">,
    | "id"
    | "household_id"
    | "amount"
    | "occurred_on"
    | "category_id"
    | "payment_method_id"
    | "memo"
  >
>

/** id はクライアント生成。再送しても upsert なので重複しない */
export async function insertTransaction(input: NewTransaction) {
  const { error } = await supabase
    .from("transactions")
    .upsert(input, { onConflict: "id", ignoreDuplicates: true })
  if (error) throw error
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) throw error
}
