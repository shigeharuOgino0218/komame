import { cn } from "cn"

/** komame のロゴマーク（ひと粒の豆） */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-6 text-primary", className)}
    >
      <path
        fill="currentColor"
        d="M8.1 3.6c3.1-1.5 7-.2 8 2.7.5 1.5.3 2.5 1.6 3.5 2 1.5 2.7 4.1 1.5 6.5-1.5 3-5.2 4.3-9 3.5C6 19 3.2 15.6 3.4 11.4c.2-3.3 2-6.3 4.7-7.8Z"
      />
      <path
        fill="none"
        stroke="var(--background)"
        strokeLinecap="round"
        strokeWidth="1.4"
        opacity="0.55"
        d="M8.2 7.6c-1.4 1-2.1 2.6-2 4.3"
      />
    </svg>
  )
}
