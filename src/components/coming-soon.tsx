import { BrandMark } from "@/components/brand-mark"

export function ComingSoon({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-24 text-center text-muted-foreground">
      <BrandMark className="size-8 text-muted-foreground/40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
