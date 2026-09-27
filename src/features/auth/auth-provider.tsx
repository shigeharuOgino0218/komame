/* eslint-disable react-refresh/only-export-components */
import type { Session } from "@supabase/supabase-js"
import * as React from "react"

import { queryClient } from "@/lib/query-client"
import { supabase } from "@/lib/supabase"

type AuthState =
  | { status: "loading"; session: null }
  | { status: "signed-in"; session: Session }
  | { status: "signed-out"; session: null }

const AuthContext = React.createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    status: "loading",
    session: null,
  })

  React.useEffect(() => {
    // セッションは localStorage から復元されるためネットワークを待たない
    supabase.auth.getSession().then(({ data }) => {
      setState(toState(data.session))
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        queryClient.clear()
      }
      setState(toState(session))
    })

    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthContext value={state}>{children}</AuthContext>
}

function toState(session: Session | null): AuthState {
  return session
    ? { status: "signed-in", session }
    : { status: "signed-out", session: null }
}

export function useAuth() {
  const context = React.use(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function useUserId() {
  const auth = useAuth()
  if (auth.status !== "signed-in") {
    throw new Error("useUserId must be used behind AuthGuard")
  }
  return auth.session.user.id
}
