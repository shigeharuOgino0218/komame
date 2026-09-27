import { ChevronLeftIcon } from "lucide-react"
import { Link } from "react-router"

import { PageHeader } from "@/components/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-provider"
import { supabase } from "@/lib/supabase"

export function SettingsPage() {
  const auth = useAuth()

  return (
    <>
      <PageHeader
        title="設定"
        action={
          <Link
            to="/summary"
            aria-label="戻る"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ChevronLeftIcon className="size-5" />
          </Link>
        }
      />
      <div className="flex flex-col gap-6 px-5">
        <section className="flex flex-col gap-1 rounded-2xl bg-card p-4 ring-1 ring-border/60">
          <p className="text-xs text-muted-foreground">ログイン中</p>
          <p className="text-sm">{auth.session?.user.email}</p>
        </section>
        <Button
          variant="outline"
          className="h-11"
          onClick={() => supabase.auth.signOut()}
        >
          ログアウト
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          komame v{__APP_VERSION__}
        </p>
      </div>
    </>
  )
}
