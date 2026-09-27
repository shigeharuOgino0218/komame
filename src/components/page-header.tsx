import type * as React from "react"

export function PageHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <header className="flex h-14 items-center justify-between px-5">
      <h1 className="text-lg font-semibold">{title}</h1>
      {action}
    </header>
  )
}
