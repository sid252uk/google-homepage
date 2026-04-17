"use client"

import { format, addMinutes } from "date-fns"
import { StatusBadge } from "@/components/reservations/StatusBadge"
import { Users } from "lucide-react"
import Link from "next/link"
import type { ReservationWithTables } from "@/types"
import type { Table } from "@/generated/prisma"

interface TimeSlotViewProps {
  reservations: ReservationWithTables[]
  tables: Table[]
  orgSlug: string
  date: Date
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 9) // 09:00 to 23:00

export function TimeSlotView({ reservations, tables, orgSlug, date }: TimeSlotViewProps) {
  function getReservationsForTableAndHour(tableId: string, hour: number) {
    return reservations.filter((res) => {
      const assigned = res.tables.some((rt) => rt.tableId === tableId)
      const resHour = new Date(res.date).getHours()
      const endTime = addMinutes(new Date(res.date), res.durationMins)
      const endHour = endTime.getHours()
      return assigned && resHour <= hour && endHour > hour
    })
  }

  const unassigned = reservations.filter((res) => res.tables.length === 0)

  return (
    <div className="overflow-auto">
      <div className="min-w-[800px]">
        {/* Header row */}
        <div
          className="grid border-b bg-muted/50 sticky top-0 z-10"
          style={{ gridTemplateColumns: `80px repeat(${tables.length}, minmax(120px, 1fr))` }}
        >
          <div className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Time
          </div>
          {tables.map((table) => (
            <div key={table.id} className="p-3 text-center">
              <p className="text-sm font-semibold">{table.name}</p>
              <p className="text-xs text-muted-foreground">{table.capacity} covers</p>
            </div>
          ))}
        </div>

        {/* Time rows */}
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid border-b hover:bg-muted/20"
            style={{ gridTemplateColumns: `80px repeat(${tables.length}, minmax(120px, 1fr))` }}
          >
            <div className="p-3 text-sm font-medium text-muted-foreground">
              {String(hour).padStart(2, "0")}:00
            </div>
            {tables.map((table) => {
              const slotReservations = getReservationsForTableAndHour(table.id, hour)
              return (
                <div
                  key={`${table.id}-${hour}`}
                  className="border-l p-1.5 min-h-[60px]"
                >
                  {slotReservations.map((res) => (
                    <Link
                      key={res.id}
                      href={`/${orgSlug}/reservations/${res.id}`}
                      className="block rounded p-1.5 bg-primary/10 hover:bg-primary/20 transition-colors mb-1"
                    >
                      <p className="text-xs font-medium truncate">{res.guestName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {res.partySize}
                      </p>
                    </Link>
                  ))}
                </div>
              )
            })}
          </div>
        ))}

        {/* Unassigned section */}
        {unassigned.length > 0 && (
          <div className="mt-6 rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
              Unassigned ({unassigned.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((res) => (
                <Link
                  key={res.id}
                  href={`/${orgSlug}/reservations/${res.id}`}
                  className="rounded-lg border bg-card px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium">{res.guestName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(res.date), "HH:mm")}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {res.partySize}
                    </span>
                    <StatusBadge status={res.status} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
