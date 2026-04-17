"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Users, Phone, Clock, MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StatusBadge, SourceBadge } from "@/components/reservations/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { updateReservationStatus, deleteReservation } from "@/server/actions/reservations"
import { toast } from "sonner"
import { ReservationStatus } from "@/generated/prisma"
import type { ReservationWithTables } from "@/types"
import { CalendarDays } from "lucide-react"
import Link from "next/link"

interface ListViewProps {
  reservations: ReservationWithTables[]
  orgSlug: string
  selectedDate?: string
}

export function ListView({ reservations, orgSlug, selectedDate }: ListViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [, startTransition] = useTransition()

  function updateSearch(value: string) {
    setSearch(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("search", value)
    else params.delete("search")
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") params.set(key, value)
    else params.delete(key)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  async function handleStatusChange(reservationId: string, status: ReservationStatus) {
    startTransition(async () => {
      const result = await updateReservationStatus(orgSlug, reservationId, status)
      if ("error" in result) toast.error(result.error as string)
      else toast.success("Status updated")
    })
  }

  async function handleDelete(reservationId: string) {
    if (!confirm("Delete this reservation? This cannot be undone.")) return
    startTransition(async () => {
      const result = await deleteReservation(orgSlug, reservationId)
      if ("error" in result) toast.error(result.error as string)
      else toast.success("Reservation deleted")
    })
  }

  if (reservations.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No reservations found"
        description="No reservations match your current filters, or none have been created yet."
        action={{ label: "New Reservation", href: `/${orgSlug}/reservations/new` }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search guest, phone, email..."
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          defaultValue={searchParams.get("status") ?? "all"}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(ReservationStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          defaultValue={selectedDate}
          onChange={(e) => updateFilter("date", e.target.value)}
          className="w-40"
        />
        <span className="text-sm text-muted-foreground ml-auto">
          {reservations.length} reservation{reservations.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ref
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Guest
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Party
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Table(s)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {reservations.map((res) => (
              <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {res.reservationNumber}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{res.guestName}</p>
                    {res.guestPhone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {res.guestPhone}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <p>{format(new Date(res.date), "EEE d MMM yyyy")}</p>
                    <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {format(new Date(res.date), "HH:mm")}
                      {" · "}
                      {res.durationMins}m
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {res.partySize}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {res.tables.length > 0 ? (
                      res.tables.map((rt) => (
                        <span
                          key={rt.tableId}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs"
                        >
                          {rt.table.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <SourceBadge source={res.source} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={res.status} />
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/${orgSlug}/reservations/${res.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {res.status === ReservationStatus.CONFIRMED && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(res.id, ReservationStatus.SEATED)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          Mark Seated
                        </DropdownMenuItem>
                      )}
                      {res.status === ReservationStatus.SEATED && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(res.id, ReservationStatus.COMPLETED)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                          Mark Completed
                        </DropdownMenuItem>
                      )}
                      {!([ReservationStatus.CANCELED, ReservationStatus.COMPLETED] as ReservationStatus[]).includes(res.status) && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(res.id, ReservationStatus.CANCELED)}
                        >
                          <XCircle className="mr-2 h-4 w-4 text-destructive" />
                          Cancel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(res.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
