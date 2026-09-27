import {
  BanknoteIcon,
  CircleIcon,
  CreditCardIcon,
  EllipsisIcon,
  HouseIcon,
  LandmarkIcon,
  PillIcon,
  QrCodeIcon,
  ShoppingBasketIcon,
  SparklesIcon,
  TrainFrontIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react"

// DB の icon 列（lucide のアイコン名）→ コンポーネント。未知の名前は丸で代替する
const icons: Record<string, LucideIcon> = {
  utensils: UtensilsIcon,
  "shopping-basket": ShoppingBasketIcon,
  "train-front": TrainFrontIcon,
  sparkles: SparklesIcon,
  house: HouseIcon,
  pill: PillIcon,
  ellipsis: EllipsisIcon,
  banknote: BanknoteIcon,
  "qr-code": QrCodeIcon,
  "credit-card": CreditCardIcon,
  landmark: LandmarkIcon,
}

export function MasterIcon({
  name,
  className,
}: {
  name: string | null
  className?: string
}) {
  const Icon = (name && icons[name]) || CircleIcon
  return <Icon className={className} aria-hidden="true" />
}
