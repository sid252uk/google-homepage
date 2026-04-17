import { Badge } from "@/components/ui/badge"
import { ReservationStatus, ReservationSource } from "@/generated/prisma"
import type { BadgeProps } from "@/components/ui/badge"

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  INQUIRY: { label: "Inquiry", variant: "outline" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  WAITLISTED: { label: "Waitlisted", variant: "warning" },
  SEATED: { label: "Seated", variant: "success" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  CANCELED: { label: "Cancelled", variant: "destructive" },
  NO_SHOW: { label: "No Show", variant: "warning" },
}

const SOURCE_CONFIG: Record<ReservationSource, { label: string; color: string }> = {
  TELEPHONE: { label: "Phone", color: "bg-blue-100 text-blue-700" },
  IN_PERSON: { label: "In Person", color: "bg-purple-100 text-purple-700" },
  WALKIN: { label: "Walk-in", color: "bg-orange-100 text-orange-700" },
  WEB_FORM: { label: "Web", color: "bg-green-100 text-green-700" },
  EMAIL: { label: "Email", color: "bg-cyan-100 text-cyan-700" },
  SOCIAL_MEDIA: { label: "Social", color: "bg-pink-100 text-pink-700" },
  THIRD_PARTY: { label: "3rd Party", color: "bg-gray-100 text-gray-700" },
}

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function SourceBadge({ source }: { source: ReservationSource }) {
  const config = SOURCE_CONFIG[source]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  )
}
