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
        <DigitButton key={key} digit={key} onDigit={onDigit} />
      ))}
      <BackspaceKey onBackspace={onBackspace} onClear={onClear} />
    </div>
  )
}

/**
 * 指が触れた瞬間（pointerdown）に反応させる。click は指を離すまで発火せず、
 * 素早い連打や2本指での交互入力を取りこぼすため。
 * キーボード（Enter/Space）や支援技術からの click は pointerdown を伴わないので click で拾う
 */
function usePress(onPress: () => void) {
  const pressedByPointer = React.useRef(false)

  return {
    onPointerDown: (event: React.PointerEvent) => {
      if (event.button !== 0) return
      pressedByPointer.current = true
      onPress()
    },
    onClick: (event: React.MouseEvent) => {
      // detail が 0 の click はキーボード操作によるもの
      if (event.detail === 0 || !pressedByPointer.current) onPress()
      pressedByPointer.current = false
    },
  }
}

function DigitButton({
  digit,
  onDigit,
}: {
  digit: DigitKey
  onDigit: (key: DigitKey) => void
}) {
  const press = usePress(() => onDigit(digit))

  return (
    <button type="button" className={keyClassName} {...press}>
      {digit}
    </button>
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
  const press = usePress(onBackspace)

  const cancel = () => {
    window.clearTimeout(timer.current)
    timer.current = undefined
  }

  return (
    <button
      type="button"
      aria-label="1文字削除（長押しで全消去）"
      className={cn(keyClassName, "text-muted-foreground")}
      onPointerDown={(event) => {
        press.onPointerDown(event)
        if (event.button !== 0) return
        cancel()
        timer.current = window.setTimeout(() => {
          onClear()
          navigator.vibrate?.(10)
        }, LONG_PRESS_MS)
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={press.onClick}
    >
      <BackspaceIcon className="size-7" />
    </button>
  )
}
