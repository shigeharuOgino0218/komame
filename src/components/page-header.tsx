import type * as React from "react"

import { SettingsLink } from "@/components/settings-link"

export function PageHeader({
  title,
  action = <SettingsLink className="-mr-2" />,
}: {
  title: string
  /** 右端の操作。省略時は設定へのリンク */
  action?: React.ReactNode
}) {
  return (
    <header className="flex h-14 items-center justify-between px-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {action}
    </header>
  )
}
