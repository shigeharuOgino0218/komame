import { BrandMark } from "@/components/brand-mark"
import { useExpenseTotals } from "@/features/transactions/queries"
import { formatYen } from "@/lib/money"

export function TotalsHeader({ householdId }: { householdId?: string }) {
  const { data } = useExpenseTotals(householdId)

  const items = [
    { label: "今日", value: data?.today },
    { label: "今週", value: data?.week },
    { label: "今月", value: data?.month },
  ]

  return (
    <header className="flex h-12 items-center justify-between gap-4">
      <BrandMark className="size-6" />
      <dl className="flex gap-5">
        {items.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-end">
            <dt className="text-[10px] leading-4 text-muted-foreground">
              {label}
            </dt>
            <dd className="text-sm leading-5 font-medium tabular-nums">
              {value === undefined ? "–" : formatYen(value)}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  )
}
