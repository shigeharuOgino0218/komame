import { CalendarIcon } from "lucide-react"
import * as React from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { chipClassName } from "@/features/entry/components/chip"
import { addDays, formatDateLabel, type Ymd } from "@/lib/date"

export function DateChip({
  date,
  today,
  onChange,
}: {
  /** null = 今日 */
  date: Ymd | null
  today: Ymd
  onChange: (date: Ymd | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const value = date ?? today

  const select = (next: Ymd) => {
    onChange(next === today ? null : next)
    setOpen(false)
  }

  const shortcuts = [today, addDays(today, -1), addDays(today, -2)]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={chipClassName(date !== null)}>
        <CalendarIcon className="size-4" />
        {formatDateLabel(value, today)}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-3 p-3">
        <div className="grid grid-cols-3 gap-2">
          {shortcuts.map((ymd) => (
            <button
              key={ymd}
              type="button"
              className={chipClassName(ymd === value, "justify-center px-2")}
              onClick={() => select(ymd)}
            >
              {formatDateLabel(ymd, today)}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          日付を選ぶ
          <input
            type="date"
            value={value}
            max={today}
            required
            className="h-11 w-full rounded-xl bg-muted/60 px-3 text-base text-foreground"
            onChange={(event) => {
              const next = event.target.value
              if (next && next <= today) select(next)
            }}
          />
        </label>
      </PopoverContent>
    </Popover>
  )
}
