"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Users, Clock } from "lucide-react"
import { assignReservationToTable } from "@/server/actions/reservations"
import { CapacityWarningDialog } from "./CapacityWarningDialog"
import { DroppableTable } from "./DroppableTable"
import { DraggableReservation } from "./DraggableReservation"
import { StatusBadge } from "@/components/reservations/StatusBadge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { DiningArea, Table, Reservation, ReservationTable } from "@/generated/prisma"

type AreaWithTables = DiningArea & {
  tables: (Table & {
    reservations: (ReservationTable & { reservation: Reservation })[]
  })[]
}

interface TablePlanCanvasProps {
  areas: AreaWithTables[]
  unassigned: Reservation[]
  orgSlug: string
  date: Date
  canDragDrop: boolean
}

interface PendingDrop {
  reservationId: string
  tableId: string
  tableName: string
  tableCapacity: number
  partySize: number
}

export function TablePlanCanvas({
  areas,
  unassigned,
  orgSlug,
  date,
  canDragDrop,
}: TablePlanCanvasProps) {
  const router = useRouter()
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null)
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null)

  // Build optimistic state map: tableId -> reservationId[]
  const [assignments, setAssignments] = useState<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>()
    for (const area of areas) {
      for (const table of area.tables) {
        map.set(table.id, table.reservations.map((rt) => rt.reservationId))
      }
    }
    return map
  })

  const [unassignedIds, setUnassignedIds] = useState<string[]>(
    unassigned.map((r) => r.id)
  )

  // Build a flat lookup for all reservations
  const allReservations = new Map<string, Reservation>()
  for (const area of areas) {
    for (const table of area.tables) {
      for (const rt of table.reservations) {
        allReservations.set(rt.reservation.id, rt.reservation)
      }
    }
  }
  for (const res of unassigned) {
    allReservations.set(res.id, res)
  }

  const allTables = new Map<string, Table>()
  for (const area of areas) {
    for (const table of area.tables) {
      allTables.set(table.id, table)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveReservationId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveReservationId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return

      const reservationId = active.id as string
      const tableId = over.id as string

      const reservation = allReservations.get(reservationId)
      const table = allTables.get(tableId)

      if (!reservation || !table) return

      if (!canDragDrop) {
        toast.error("Upgrade to Pro to use drag-and-drop table assignment")
        return
      }

      // Check capacity
      if (reservation.partySize > table.capacity) {
        setPendingDrop({
          reservationId,
          tableId,
          tableName: table.name,
          tableCapacity: table.capacity,
          partySize: reservation.partySize,
        })
        return
      }

      await performAssignment(reservationId, tableId)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allReservations, allTables, canDragDrop]
  )

  async function performAssignment(reservationId: string, tableId: string) {
    // Optimistic update
    setAssignments((prev) => {
      const next = new Map(prev)
      for (const [tid, rids] of next) {
        next.set(tid, rids.filter((id) => id !== reservationId))
      }
      next.set(tableId, [...(next.get(tableId) ?? []), reservationId])
      return next
    })
    setUnassignedIds((prev) => prev.filter((id) => id !== reservationId))

    const result = await assignReservationToTable(orgSlug, reservationId, tableId)
    if (result.error) {
      toast.error(result.error)
      router.refresh()
    } else {
      toast.success("Table assigned")
    }
  }

  const activeReservation = activeReservationId
    ? allReservations.get(activeReservationId)
    : null

  return (
    <>
      <CapacityWarningDialog
        open={!!pendingDrop}
        partySize={pendingDrop?.partySize ?? 0}
        tableCapacity={pendingDrop?.tableCapacity ?? 0}
        tableName={pendingDrop?.tableName ?? ""}
        onConfirm={async () => {
          if (pendingDrop) {
            await performAssignment(pendingDrop.reservationId, pendingDrop.tableId)
          }
          setPendingDrop(null)
        }}
        onCancel={() => setPendingDrop(null)}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-0">
          {/* Unassigned panel */}
          <div className="w-64 border-r bg-muted/20 flex flex-col">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold">
                Unassigned
                {unassignedIds.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {unassignedIds.length}
                  </span>
                )}
              </h3>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {unassignedIds.map((id) => {
                  const res = allReservations.get(id)
                  if (!res) return null
                  return (
                    <DraggableReservation
                      key={id}
                      reservation={res}
                      canDrag={canDragDrop}
                    />
                  )
                })}
                {unassignedIds.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    All reservations assigned
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Floor plan */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {areas.map((area) => (
                <div key={area.id} className="mb-8">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    {area.name}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {area.tables.map((table) => {
                      const reservationIds = assignments.get(table.id) ?? []
                      const tableReservations = reservationIds
                        .map((id) => allReservations.get(id))
                        .filter(Boolean) as Reservation[]
                      return (
                        <DroppableTable
                          key={table.id}
                          table={table}
                          reservations={tableReservations}
                          canDrag={canDragDrop}
                          orgSlug={orgSlug}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
              {areas.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-sm">No dining areas configured.</p>
                  <p className="text-sm mt-1">
                    Set up areas and tables in Settings → Tables & Areas.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DragOverlay>
          {activeReservation && (
            <div className="rounded-lg border-2 border-primary bg-card p-3 shadow-xl w-52 opacity-90">
              <p className="text-sm font-semibold truncate">{activeReservation.guestName}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {activeReservation.partySize}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(activeReservation.date), "HH:mm")}
                </span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  )
}
