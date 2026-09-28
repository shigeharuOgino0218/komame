import * as React from "react"

import { Button } from "@/components/ui/button"
import { hasEverSetBudget } from "@/features/budget/current-budget"
import { useBudgets, useSavingsBalance } from "@/features/budget/queries"
import type { DigitKey } from "@/features/entry/amount"
import { AmountDisplay } from "@/features/entry/components/amount-display"
import { CategoryChips } from "@/features/entry/components/category-chips"
import { DateChip } from "@/features/entry/components/date-chip"
import { Keypad } from "@/features/entry/components/keypad"
import { MemoField } from "@/features/entry/components/memo-field"
import { PaymentMethodChips } from "@/features/entry/components/payment-method-chips"
import { SavingsChip } from "@/features/entry/components/savings-chip"
import { TotalsHeader } from "@/features/entry/components/totals-header"
import {
  rememberPaymentMethod,
  useEntryForm,
} from "@/features/entry/use-entry-form"
import { useSaveTransaction } from "@/features/entry/use-save-transaction"
import {
  useCategories,
  useHouseholdId,
  usePaymentMethods,
} from "@/features/masters/queries"
import { todayYmd } from "@/lib/date"
import { uuid } from "@/lib/uuid"

const DIGIT_KEYS = new Set<string>([
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
])

export function EntryPage() {
  const householdId = useHouseholdId()
  const { data: categories } = useCategories(householdId)
  const { data: paymentMethods } = usePaymentMethods(householdId)
  const [state, dispatch] = useEntryForm()
  const { data: budgetRows } = useBudgets(householdId)
  const saveTransaction = useSaveTransaction()
  const today = todayYmd()

  // 予算を一度も設定していない世帯には自由貯金を出さない
  const showSavings = budgetRows !== undefined && hasEverSetBudget(budgetRows)
  const { data: savingsBalance } = useSavingsBalance(householdId, {
    enabled: showSavings,
  })
  const fromSavings = showSavings && state.fromSavings
  const savingsShort =
    fromSavings &&
    (savingsBalance === undefined || state.amount > savingsBalance)

  // 前回の支払方法がアーカイブ済みなどで存在しなければ未選択扱い
  const paymentMethodId =
    paymentMethods && state.paymentMethodId
      ? (paymentMethods.find((method) => method.id === state.paymentMethodId)
          ?.id ?? null)
      : state.paymentMethodId

  const canSave = state.amount > 0 && householdId !== undefined && !savingsShort

  const handleSave = () => {
    if (!canSave || householdId === undefined) return

    const category = categories?.find((c) => c.id === state.categoryId)
    const paymentMethod = paymentMethods?.find((m) => m.id === paymentMethodId)
    const description = [
      category?.name ?? "未分類",
      paymentMethod?.name,
      fromSavings && "自由貯金",
    ]
      .filter(Boolean)
      .join("・")

    saveTransaction(
      {
        id: uuid(),
        household_id: householdId,
        amount: state.amount,
        occurred_on: state.date ?? todayYmd(),
        category_id: state.categoryId,
        payment_method_id: paymentMethodId,
        memo: state.memo.trim() || null,
        funding: fromSavings ? "savings" : "budget",
      },
      description
    )
    rememberPaymentMethod(paymentMethodId)
    dispatch({ type: "reset-after-save" })
  }

  // PC のキーボードでも入力できるようにする（入力欄にフォーカスがあるときは除く）
  const onKeyDown = React.useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.closest("input, textarea, select, [contenteditable='true']")) {
      return
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if (DIGIT_KEYS.has(event.key)) {
      dispatch({ type: "digit", key: event.key as DigitKey })
    } else if (event.key === "Backspace") {
      dispatch({ type: "backspace" })
    } else if (event.key === "Escape") {
      dispatch({ type: "clear" })
    } else if (event.key === "Enter" && target?.tagName !== "BUTTON") {
      handleSave()
    } else {
      return
    }
    event.preventDefault()
  })

  React.useEffect(() => {
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="mx-auto flex h-full max-w-md flex-col gap-2 px-4 pb-3 *:shrink-0">
      <TotalsHeader householdId={householdId} />

      <div className="flex min-h-14 flex-1 flex-col justify-end pb-1">
        <AmountDisplay amount={state.amount} />
      </div>

      <div className="flex gap-2">
        <DateChip
          date={state.date}
          today={today}
          onChange={(date) => dispatch({ type: "set-date", date })}
        />
        <MemoField
          value={state.memo}
          onChange={(memo) => dispatch({ type: "set-memo", memo })}
        />
        {showSavings && (
          <SavingsChip
            balance={savingsBalance}
            selected={fromSavings}
            insufficient={savingsShort}
            onToggle={() => dispatch({ type: "toggle-savings" })}
          />
        )}
      </div>

      <PaymentMethodChips
        paymentMethods={paymentMethods}
        selectedId={paymentMethodId}
        onToggle={(id) => dispatch({ type: "toggle-payment-method", id })}
      />

      <CategoryChips
        categories={categories}
        selectedId={state.categoryId}
        onToggle={(id) => dispatch({ type: "toggle-category", id })}
      />

      <Keypad
        className="h-[clamp(168px,calc(100dvh-428px-env(safe-area-inset-top)-env(safe-area-inset-bottom)),300px)]"
        onDigit={(key) => dispatch({ type: "digit", key })}
        onBackspace={() => dispatch({ type: "backspace" })}
        onClear={() => dispatch({ type: "clear" })}
      />

      <Button
        className="h-13 rounded-full text-base font-semibold"
        disabled={!canSave}
        onClick={handleSave}
      >
        {savingsShort && state.amount > 0 ? "貯金が足りません" : "記録する"}
      </Button>
    </div>
  )
}
