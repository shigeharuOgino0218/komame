import { createBrowserRouter, Navigate } from "react-router"

import { AppLayout } from "@/app/layouts/app-layout"
import { AuthGuard } from "@/app/layouts/auth-guard"
import { LoginPage } from "@/features/auth/login-page"
import { EntryPage } from "@/features/entry/entry-page"
import { SettingsPage } from "@/features/settings/settings-page"
import { SummaryPage } from "@/features/summary/summary-page"
import { HistoryPage } from "@/features/transactions/history-page"

export const router = createBrowserRouter([
  { path: "/login", Component: LoginPage },
  {
    Component: AuthGuard,
    children: [
      {
        Component: AppLayout,
        children: [
          { index: true, Component: EntryPage },
          { path: "history", Component: HistoryPage },
          { path: "summary", Component: SummaryPage },
          { path: "settings", Component: SettingsPage },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
