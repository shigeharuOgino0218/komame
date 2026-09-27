import { Navigate, Outlet } from "react-router"

import { useAuth } from "@/features/auth/auth-provider"

export function AuthGuard() {
  const auth = useAuth()

  // セッション復元は localStorage 読み込みだけなので一瞬で終わる
  if (auth.status === "loading") {
    return null
  }
  if (auth.status === "signed-out") {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
