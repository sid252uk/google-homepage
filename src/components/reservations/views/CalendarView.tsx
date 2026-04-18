"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReservationStatus } from "@/generated/prisma"
import type { ReservationWithTables } from "@/types"

interface CalendarViewProps {
  reservations: ReservationWithTables[]
  orgSlug: string
  selectedDate?: string
}

const STATUS_COLOR: Record<ReservationStatus, string> = {
  INQUIRY: "bg-yellow-400",
  CONFIRMED: "bg-blue-500",
  WAITLISTED: "bg-purple-400",
  SEATED: "bg-green-500",
  COMPLETED: "bg-gray-400",
  CANCELED: "bg-red-400",
  NO_SHOW: "bg-orange-400",
}

export function CalendarView({ reservations, orgSlug, selectedDate }: CalendarViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentMonth, setCurrentMonth] = useState(() =>
    selectedDate ? startOfMonth(new Date(selectedDate)) : startOfMonth(new Date())
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })

  function getResForDay(day: Date) {
    return reservations.filter((r) => isSameDay(new Date(r.date), day))
  }

  function navigateToDay(day: Date) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("date", format(day, "yyyy-MM-dd"))
    params.set("view", "list")
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const selected = selectedDate ? new Date(selectedDate) : null

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border rounded-t-lg overflow-hidden">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="bg-muted/50 border-b px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {calDays.map((day) => {
          const dayRes = getResForDay(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selected ? isSameDay(day, selected) : false
          const isTodayDay = isToday(day)

          // Group by status for the dots
          const statusGroups = Object.values(ReservationStatus).filter(
            (s) => dayRes.some((r) => r.status === s)
          )

          return (
            <button
              key={day.toISOString()}
              onClick={() => navigateToDay(day)}
              className={cn(
                "border-b border-r last:border-r-0 p-2 min-h-[90px] text-left hover:bg-muted/30 transition-colors relative",
                !isCurrentMonth && "opacity-40",
                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium mb-1",
                  isTodayDay && "bg-primary text-primary-foreground",
                  !isTodayDay && "text-foreground"
                )}
              >
                {format(day, "d")}
              </span>

              {dayRes.length > 0 && (
                <div className="space-y-1">
                  {/* Show up to 3 reservation previews */}
                  {dayRes.slice(0, 3).map((res) => (
                    <div
                      key={res.id}
                      className="flex items-center gap-1 text-xs truncate"
                    >
                      <span
                        className={cn(
                          "inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full",
                          STATUS_COLOR[res.status]
                        )}
                      />
                      <span className="truncate text-muted-foreground">
                        {format(new Date(res.date), "HH:mm")} {res.guestName}
                      </span>
                    </div>
                  ))}
                  {dayRes.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-2.5">
                      +{dayRes.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-1">
        {(
          [
            ["INQUIRY", "Inquiry"],
            ["CONFIRMED", "Confirmed"],
            ["WAITLISTED", "Waitlisted"],
            ["SEATED", "Seated"],
            ["COMPLETED", "Completed"],
            ["CANCELED", "Cancelled"],
            ["NO_SHOW", "No Show"],
          ] as [ReservationStatus, string][]
        ).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("inline-block h-2 w-2 rounded-full", STATUS_COLOR[status])} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
