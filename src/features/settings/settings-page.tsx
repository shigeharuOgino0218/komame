import { ChevronLeftIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-provider"
import { ThemeSelect } from "@/features/settings/theme-select"
import { supabase } from "@/lib/supabase"

export function SettingsPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  // 設定はどの画面からも開くので、開く前の画面に戻る。直接開いたときは入力画面へ
  const goBack = () => {
    const canGoBack = (window.history.state?.idx ?? 0) > 0
    if (canGoBack) {
      navigate(-1)
    } else {
      navigate("/", { replace: true })
    }
  }

  return (
    <>
      <PageHeader
        title="設定"
        action={
          <Button
            variant="ghost"
            size="icon"
            aria-label="戻る"
            className="-mr-2"
            onClick={goBack}
          >
            <ChevronLeftIcon className="size-5" />
          </Button>
        }
      />
      <div className="flex flex-col gap-6 px-4">
        <section className="flex flex-col gap-1 rounded-2xl bg-card p-4 ring-1 ring-border/60">
          <p className="text-xs text-muted-foreground">ログイン中</p>
          <p className="text-sm">{auth.session?.user.email}</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs text-muted-foreground">テーマ</h2>
          <ThemeSelect />
          <p className="px-1 text-xs text-muted-foreground">
            自動は端末の設定（ライト / ダーク）に合わせます
          </p>
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
