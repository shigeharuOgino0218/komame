import { chipClassName } from "@/features/entry/components/chip"
import { MasterIcon } from "@/features/masters/master-icon"
import type { Category } from "@/features/masters/queries"

export function CategoryGrid({
  categories,
  selectedId,
  onToggle,
}: {
  categories: Category[] | undefined
  selectedId: string | null
  onToggle: (id: string) => void
}) {
  return (
    <div
      role="group"
      aria-label="カテゴリ（任意）"
      className="grid grid-cols-3 gap-2"
    >
      {categories
        ? categories.map((category) => {
            const selected = category.id === selectedId
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                className={chipClassName(
                  selected,
                  "h-10 justify-center rounded-2xl px-2"
                )}
                onClick={() => onToggle(category.id)}
              >
                <MasterIcon name={category.icon} className="size-4" />
                {category.name}
              </button>
            )
          })
        : Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-10 rounded-2xl bg-muted/50" />
          ))}
    </div>
  )
}
