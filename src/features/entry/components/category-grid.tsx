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
      className="grid grid-cols-6 gap-1.5"
    >
      {categories
        ? categories.map((category) => {
            const selected = category.id === selectedId
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                title={category.name}
                className={chipClassName(
                  selected,
                  "h-14 flex-col justify-center gap-1 rounded-2xl px-1 text-[11px] leading-none"
                )}
                onClick={() => onToggle(category.id)}
              >
                <MasterIcon name={category.icon} className="size-5" />
                {/* 1マスに収まるのは3文字程度。長い名前は末尾を省略する */}
                <span className="max-w-full truncate">{category.name}</span>
              </button>
            )
          })
        : Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-14 rounded-2xl bg-muted" />
          ))}
    </div>
  )
}
