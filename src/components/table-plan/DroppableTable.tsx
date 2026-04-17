"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { DraggableReservation } from "./DraggableReservation"
import { Users } from "lucide-react"
import type { Table, Reservation } from "@/generated/prisma"

interface DroppableTableProps {
  table: Table
  reservations: Reservation[]
  canDrag: boolean
  orgSlug: string
}

export function DroppableTable({ table, reservations, canDrag, orgSlug }: DroppableTableProps) {
  const { isOver, setNodeRef } = useDroppable({ id: table.id })

  const totalCovers = reservations.reduce((sum, r) => sum + r.partySize, 0)
  const fillPercent = Math.min((totalCovers / table.capacity) * 100, 100)
  const isOver80 = fillPercent >= 80

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex flex-col rounded-xl border-2 transition-all",
        "min-w-[160px] min-h-[140px] p-3",
        isOver
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-muted-foreground/40",
        table.shape === "CIRCLE" && "rounded-full min-w-[140px] min-h-[140px] items-center justify-center"
      )}
    >
      {/* Table header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold leading-none">{table.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {table.capacity}
          </p>
        </div>
        {/* Capacity bar */}
        <div className="w-12">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isOver80 ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-right text-muted-foreground mt-0.5">
            {totalCovers}/{table.capacity}
          </p>
        </div>
      </div>

      {/* Reservations on this table */}
      <div className="flex flex-col gap-1.5 flex-1">
        {reservations.map((res) => (
          <DraggableReservation
            key={res.id}
            reservation={res}
            canDrag={canDrag}
            compact
          />
        ))}
        {reservations.length === 0 && (
          <div
            className={cn(
              "flex-1 flex items-center justify-center rounded-lg border-2 border-dashed",
              isOver ? "border-primary/50" : "border-muted"
            )}
          >
            <p className="text-xs text-muted-foreground">
              {isOver ? "Drop here" : "Empty"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
