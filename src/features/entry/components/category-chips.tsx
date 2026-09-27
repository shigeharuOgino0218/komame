import { cn } from "cn"

import { chipClassName } from "@/features/entry/components/chip"
import { MasterIcon } from "@/features/masters/master-icon"
import type { Category } from "@/features/masters/queries"

/**
 * 5個がまるごと見え、6個目が半分見切れる幅にして、横スクロールで続きがあると分かるようにする。
 * 左余白16px + 5.5w + 間隔6px×5 = スクロール領域の幅（100% + 左右余白32px）→ w = (100% - 14px) / 5.5
 */
const chipWidth = "w-[calc((100%-14px)/5.5)]"

export function CategoryChips({
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
      className="-mx-4 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden"
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
                  cn(
                    "h-16 flex-col justify-center gap-2 rounded-2xl px-1 text-[11px] leading-none",
                    chipWidth
                  )
                )}
                onClick={() => onToggle(category.id)}
              >
                <MasterIcon name={category.icon} className="size-5" />
                {/* 1マスに収まるのは3〜4文字。長い名前は末尾を省略する */}
                <span className="max-w-full truncate">{category.name}</span>
              </button>
            )
          })
        : Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className={cn("h-16 shrink-0 rounded-2xl bg-muted", chipWidth)}
            />
          ))}
    </div>
  )
}
