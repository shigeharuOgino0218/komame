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
  // カテゴリ数に合わせて1段に並べる（6個を超えたら折り返す）。読み込み中は初期マスタの5列
  const columns = Math.min(Math.max(categories?.length ?? 5, 1), 6)

  return (
    <div
      role="group"
      aria-label="カテゴリ（任意）"
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
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
        : Array.from({ length: columns }, (_, index) => (
            <div key={index} className="h-14 rounded-2xl bg-muted" />
          ))}
    </div>
  )
}
