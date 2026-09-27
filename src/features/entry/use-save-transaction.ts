import { useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import {
  deleteTransaction,
  insertTransaction,
  type NewTransaction,
} from "@/features/transactions/api"
import {
  addToTotalsCache,
  removeFromTotalsCache,
  transactionKeys,
} from "@/features/transactions/queries"
import { formatYen } from "@/lib/money"

const UNDO_DURATION_MS = 5_000

// 送信中の insert。取り消しは insert の完了を待ってから delete する
const pendingInserts = new Map<string, Promise<void>>()
const undoneIds = new Set<string>()

/**
 * 楽観的に保存する。呼び出し側はすぐフォームをリセットしてよい。
 * 失敗時は内容をトーストの「再試行」に保持する（Phase 4 で IndexedDB の outbox に置き換える）。
 */
export function useSaveTransaction() {
  const queryClient = useQueryClient()

  return React.useCallback(
    (input: NewTransaction, description: string) => {
      const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: transactionKeys.all })

      const undo = async () => {
        undoneIds.add(input.id)
        removeFromTotalsCache(queryClient, input.id)
        try {
          await pendingInserts.get(input.id)?.catch(() => undefined)
          await deleteTransaction(input.id)
          toast("取り消しました", { id: input.id, duration: 2_000 })
        } catch {
          toast.error("取り消せませんでした", { id: input.id })
        } finally {
          void invalidate()
        }
      }

      const save = () => {
        undoneIds.delete(input.id)
        addToTotalsCache(queryClient, input)
        toast.success(`${formatYen(input.amount)} を記録`, {
          id: input.id,
          description,
          duration: UNDO_DURATION_MS,
          action: { label: "取り消す", onClick: () => void undo() },
        })

        const request = insertTransaction(input)
        pendingInserts.set(input.id, request)
        request
          .then(() => invalidate())
          .catch(() => {
            if (undoneIds.has(input.id)) return
            removeFromTotalsCache(queryClient, input.id)
            toast.error(`${formatYen(input.amount)} を保存できませんでした`, {
              id: input.id,
              description,
              duration: Infinity,
              closeButton: true,
              action: { label: "再試行", onClick: save },
            })
          })
          .finally(() => pendingInserts.delete(input.id))
      }

      save()
    },
    [queryClient]
  )
}
