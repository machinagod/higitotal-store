import {
  Bath,
  BedDouble,
  Brush,
  Building2,
  ChefHat,
  Coffee,
  CookingPot,
  Droplets,
  Factory,
  Flame,
  Hand,
  HeartPulse,
  type LucideIcon,
  Package,
  Recycle,
  School,
  ScrollText,
  ShieldCheck,
  Shirt,
  Sparkles,
  SprayCan,
  Utensils,
  WashingMachine,
} from "lucide-react"

import type { SectorIcon as SectorIconId } from "@lib/sectors"

const ICONS: Record<SectorIconId, LucideIcon> = {
  bath: Bath,
  bed: BedDouble,
  brush: Brush,
  building: Building2,
  "chef-hat": ChefHat,
  coffee: Coffee,
  "cooking-pot": CookingPot,
  droplets: Droplets,
  factory: Factory,
  flame: Flame,
  hand: Hand,
  "heart-pulse": HeartPulse,
  package: Package,
  recycle: Recycle,
  school: School,
  scroll: ScrollText,
  shield: ShieldCheck,
  shirt: Shirt,
  sparkles: Sparkles,
  "spray-can": SprayCan,
  utensils: Utensils,
  "washing-machine": WashingMachine,
}

/** Decorative Lucide icon for a sector or a sector need. */
export default function SectorIcon({
  icon,
  className,
}: {
  icon: SectorIconId
  className?: string
}) {
  const Icon = ICONS[icon]
  return <Icon className={className} aria-hidden />
}
