import { chipClassName } from "@/features/entry/components/chip"
import { MasterIcon } from "@/features/masters/master-icon"
import type { PaymentMethod } from "@/features/masters/queries"

export function PaymentMethodChips({
  paymentMethods,
  selectedId,
  onToggle,
}: {
  paymentMethods: PaymentMethod[] | undefined
  selectedId: string | null
  onToggle: (id: string) => void
}) {
  return (
    <div
      role="group"
      aria-label="支払方法（任意）"
      className="-mx-4 flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden"
    >
      {paymentMethods
        ? paymentMethods.map((method) => {
            const selected = method.id === selectedId
            return (
              <button
                key={method.id}
                type="button"
                aria-pressed={selected}
                className={chipClassName(selected)}
                onClick={() => onToggle(method.id)}
              >
                <MasterIcon name={method.icon} className="size-4" />
                {method.name}
              </button>
            )
          })
        : Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-10 w-24 shrink-0 rounded-full bg-muted"
            />
          ))}
    </div>
  )
}
