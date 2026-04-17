"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Users, Clock, GripVertical } from "lucide-react"
import { StatusBadge } from "@/components/reservations/StatusBadge"
import type { Reservation } from "@/generated/prisma"

interface DraggableReservationProps {
  reservation: Reservation
  canDrag: boolean
  compact?: boolean
}

export function DraggableReservation({
  reservation,
  canDrag,
  compact = false,
}: DraggableReservationProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: reservation.id,
    disabled: !canDrag,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card transition-all select-none",
        compact ? "p-2" : "p-3",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        canDrag && "cursor-grab active:cursor-grabbing"
      )}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        {canDrag && (
          <GripVertical
            className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0"
            {...listeners}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium truncate", compact ? "text-xs" : "text-sm")}>
            {reservation.guestName}
          </p>
          <div className={cn("flex items-center gap-2 mt-0.5", compact ? "text-[10px]" : "text-xs", "text-muted-foreground")}>
            <span className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {reservation.partySize}
            </span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {format(new Date(reservation.date), "HH:mm")}
            </span>
          </div>
          {!compact && (
            <div className="mt-1.5">
              <StatusBadge status={reservation.status} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
