import { useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import {
  adjustSavingsBalanceCache,
  budgetKeys,
} from "@/features/budget/queries"
import {
  deleteTransaction,
  insertTransaction,
} from "@/features/transactions/api"
import {
  removeFromPages,
  restoreToPages,
  type HistoryItem,
} from "@/features/transactions/history"
import {
  addToTotalsCache,
  removeFromTotalsCache,
  transactionKeys,
  updateHistoryCache,
} from "@/features/transactions/queries"
import { formatYen } from "@/lib/money"

const UNDO_DURATION_MS = 5_000

// 送信中の delete。取り消しは delete の完了を待ってから insert し直す
const pendingDeletes = new Map<string, Promise<void>>()
const undoneIds = new Set<string>()

/** 楽観的に削除し、トーストの「取り消す」で同じ id のまま戻す */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return React.useCallback(
    (item: HistoryItem) => {
      // 過去の期間の予算支出は余り（貯金残高）も変えるので、残高も取り直す
      const invalidate = () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
          queryClient.invalidateQueries({
            queryKey: budgetKeys.savingsBalanceAll,
          }),
        ])

      const fromSavings = item.funding === "savings"
      const removeFromCache = () => {
        updateHistoryCache(queryClient, (pages) =>
          removeFromPages(pages, item.id)
        )
        if (fromSavings) {
          adjustSavingsBalanceCache(queryClient, item.amount)
        } else {
          removeFromTotalsCache(queryClient, item.id)
        }
      }
      const restoreCache = () => {
        updateHistoryCache(queryClient, (pages) => restoreToPages(pages, item))
        if (fromSavings) {
          adjustSavingsBalanceCache(queryClient, -item.amount)
        } else {
          addToTotalsCache(queryClient, item)
        }
      }

      const undo = async () => {
        undoneIds.add(item.id)
        restoreCache()
        try {
          await pendingDeletes.get(item.id)?.catch(() => undefined)
          await insertTransaction({
            id: item.id,
            household_id: item.household_id,
            amount: item.amount,
            occurred_on: item.occurred_on,
            category_id: item.category_id,
            payment_method_id: item.payment_method_id,
            memo: item.memo,
            funding: item.funding,
            created_at: item.created_at,
          })
          toast("元に戻しました", { id: item.id, duration: 2_000 })
        } catch {
          toast.error("元に戻せませんでした", { id: item.id })
        } finally {
          void invalidate()
        }
      }

      undoneIds.delete(item.id)
      removeFromCache()
      toast(`${formatYen(item.amount)} を削除しました`, {
        id: item.id,
        description: item.category?.name ?? "未分類",
        duration: UNDO_DURATION_MS,
        action: { label: "取り消す", onClick: () => void undo() },
      })

      const request = deleteTransaction(item.id)
      pendingDeletes.set(item.id, request)
      request
        .then(() => invalidate())
        .catch(() => {
          if (undoneIds.has(item.id)) return
          restoreCache()
          toast.error(`${formatYen(item.amount)} を削除できませんでした`, {
            id: item.id,
          })
        })
        .finally(() => pendingDeletes.delete(item.id))
    },
    [queryClient]
  )
}
