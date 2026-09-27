import { SettingsIcon } from "lucide-react"
import { Link } from "react-router"

import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"

export function SettingsLink({ className }: { className?: string }) {
  return (
    <Link
      to="/settings"
      aria-label="設定"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "text-muted-foreground",
        className
      )}
    >
      <SettingsIcon className="size-5" />
    </Link>
  )
}
