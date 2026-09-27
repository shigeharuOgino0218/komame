import { ChartPieIcon, ListIcon, SquarePenIcon } from "lucide-react"
import { NavLink, Outlet } from "react-router"

import { cn } from "cn"

const tabs = [
  { to: "/", label: "入力", icon: SquarePenIcon },
  { to: "/history", label: "履歴", icon: ListIcon },
  { to: "/summary", label: "集計", icon: ChartPieIcon },
] as const

export function AppLayout() {
  return (
    <div className="flex h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <nav className="shrink-0 border-t border-border/60 bg-background pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground transition-colors",
                    isActive && "text-primary"
                  )
                }
              >
                <Icon className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
