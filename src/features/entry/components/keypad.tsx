import * as React from "react"

import { cn } from "cn"

import type { DigitKey } from "@/features/entry/amount"
import { BackspaceIcon } from "@/features/entry/components/backspace-icon"

const LONG_PRESS_MS = 500

const digitRows: DigitKey[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["00", "0"],
]

const keyClassName =
  "flex touch-manipulation items-center justify-center rounded-2xl bg-muted/80 text-2xl font-medium tabular-nums transition-colors select-none [-webkit-touch-callout:none] active:bg-muted"

export function Keypad({
  onDigit,
  onBackspace,
  onClear,
  className,
}: {
  onDigit: (key: DigitKey) => void
  onBackspace: () => void
  onClear: () => void
  className?: string
}) {
  return (
    <div
      className={cn("grid grid-cols-3 grid-rows-4 gap-1", className)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {digitRows.flat().map((key) => (
        <button
          key={key}
          type="button"
          className={keyClassName}
          onClick={() => onDigit(key)}
        >
          {key}
        </button>
      ))}
      <BackspaceKey onBackspace={onBackspace} onClear={onClear} />
    </div>
  )
}

/** タップで1桁削除、長押しで全消去 */
function BackspaceKey({
  onBackspace,
  onClear,
}: {
  onBackspace: () => void
  onClear: () => void
}) {
  const timer = React.useRef<number | undefined>(undefined)
  const longPressed = React.useRef(false)

  const cancel = () => {
    window.clearTimeout(timer.current)
    timer.current = undefined
  }

  return (
    <button
      type="button"
      aria-label="1文字削除（長押しで全消去）"
      className={cn(keyClassName, "text-muted-foreground")}
      onPointerDown={() => {
        longPressed.current = false
        cancel()
        timer.current = window.setTimeout(() => {
          longPressed.current = true
          onClear()
          navigator.vibrate?.(10)
        }, LONG_PRESS_MS)
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={() => {
        // 長押しで全消去したときはクリックを無視する。キーボード操作（Enter/Space）でも1桁削除
        if (!longPressed.current) onBackspace()
        longPressed.current = false
      }}
    >
      <BackspaceIcon className="size-7" />
    </button>
  )
}
