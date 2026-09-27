import { MoonIcon, SmartphoneIcon, SunIcon } from "lucide-react"

import { cn } from "cn"

import { useTheme, type Theme } from "@/components/theme-provider"

const options: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "system", label: "自動", icon: SmartphoneIcon },
  { value: "light", label: "ライト", icon: SunIcon },
  { value: "dark", label: "ダーク", icon: MoonIcon },
]

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="テーマ"
      className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const selected = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              "flex h-10 items-center justify-center gap-1.5 rounded-full text-sm text-muted-foreground transition-colors",
              selected && "bg-card font-medium text-foreground shadow-sm"
            )}
            onClick={() => setTheme(value)}
          >
            <Icon className="size-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
