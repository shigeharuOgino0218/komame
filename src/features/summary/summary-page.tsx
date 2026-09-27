import { SettingsIcon } from "lucide-react"
import { Link } from "react-router"

import { ComingSoon } from "@/components/coming-soon"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"

export function SummaryPage() {
  return (
    <>
      <PageHeader
        title="集計"
        action={
          <Link
            to="/settings"
            aria-label="設定"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <SettingsIcon className="size-5" />
          </Link>
        }
      />
      <ComingSoon message="集計は準備中です" />
    </>
  )
}
