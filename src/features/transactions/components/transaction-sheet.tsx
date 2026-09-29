import { Trash2Icon } from "lucide-react"
import type * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { MasterIcon } from "@/features/masters/master-icon"
import type { HistoryItem } from "@/features/transactions/history"
import { formatDateLabel, formatDateTime } from "@/lib/date"
import { formatYen } from "@/lib/money"

/** 取引の詳細。下にスワイプか背景のタップで閉じる */
export function TransactionSheet({
  item,
  open,
  onOpenChange,
  onDelete,
}: {
  /** 閉じるアニメーション中も中身を出すため、閉じても直前の行を渡し続ける */
  item: HistoryItem | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (item: HistoryItem) => void
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        {item && (
          <>
            <DrawerHeader className="items-center gap-2 pt-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MasterIcon
                  name={item.category?.icon ?? null}
                  className="size-4"
                />
                {item.category?.name ?? "未分類"}
              </span>
              <DrawerTitle className="text-3xl font-semibold tabular-nums">
                {formatYen(item.amount)}
              </DrawerTitle>
            </DrawerHeader>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 p-4">
              <Detail label="利用日">
                {formatDateLabel(item.occurred_on)}
              </Detail>
              <Detail label="支払方法">
                {item.payment_method?.name ?? "未設定"}
              </Detail>
              <Detail label="支払元">
                {item.funding === "savings" ? "貯金" : "予算"}
              </Detail>
              {item.memo && (
                <Detail label="メモ">
                  <span className="break-words whitespace-pre-wrap">
                    {item.memo}
                  </span>
                </Detail>
              )}
              <Detail label="記録日時">
                {formatDateTime(item.created_at)}
              </Detail>
            </dl>
            <DrawerFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                variant="destructive"
                className="h-12 rounded-full text-base"
                onClick={() => onDelete(item)}
              >
                <Trash2Icon className="size-4" />
                削除
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function Detail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </>
  )
}
