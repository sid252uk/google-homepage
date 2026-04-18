import { Header } from "@/components/layout/Header"
import { requireOrgAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/reservations/StatusBadge"
import { Button } from "@/components/ui/button"
import { ReservationStatus } from "@/generated/prisma"
import { startOfDay, endOfDay, addDays, format } from "date-fns"
import { CalendarDays, Users, UtensilsCrossed, Clock, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const org = await requireOrgAccess(orgSlug)

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  const [todayReservations, upcomingReservations, totalTables, totalCovers] =
    await Promise.all([
      prisma.reservation.findMany({
        where: {
          organizationId: org.id,
          date: { gte: todayStart, lte: todayEnd },
          status: { notIn: [ReservationStatus.CANCELED, ReservationStatus.NO_SHOW] },
        },
        include: { tables: { include: { table: true } } },
        orderBy: { date: "asc" },
      }),
      prisma.reservation.findMany({
        where: {
          organizationId: org.id,
          date: { gte: todayEnd, lte: endOfDay(addDays(today, 7)) },
          status: { notIn: [ReservationStatus.CANCELED, ReservationStatus.NO_SHOW] },
        },
        orderBy: { date: "asc" },
        take: 10,
      }),
      prisma.table.count({
        where: { organizationId: org.id, isActive: true },
      }),
      prisma.reservation.aggregate({
        where: {
          organizationId: org.id,
          date: { gte: todayStart, lte: todayEnd },
          status: { notIn: [ReservationStatus.CANCELED, ReservationStatus.NO_SHOW] },
        },
        _sum: { partySize: true },
      }),
    ])

  const confirmedToday = todayReservations.filter(
    (r) =>
      r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.SEATED
  ).length
  const seatedNow = todayReservations.filter(
    (r) => r.status === ReservationStatus.SEATED
  ).length
  const coversToday = totalCovers._sum.partySize ?? 0

  const stats = [
    {
      label: "Today's Reservations",
      value: todayReservations.length,
      sub: `${confirmedToday} confirmed`,
      icon: CalendarDays,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Covers Today",
      value: coversToday,
      sub: "guests expected",
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Currently Seated",
      value: seatedNow,
      sub: `of ${totalTables} tables`,
      icon: UtensilsCrossed,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950",
    },
    {
      label: "Next 7 Days",
      value: upcomingReservations.length,
      sub: "upcoming reservations",
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
  ]

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="Dashboard"
        actions={
          <Button asChild size="sm">
            <Link href={`/${orgSlug}/reservations/new`}>
              <Plus className="h-4 w-4" />
              New Reservation
            </Link>
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's reservations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Today — {format(today, "EEEE d MMMM")}</CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href={`/${orgSlug}/reservations?date=${format(today, "yyyy-MM-dd")}`}>
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {todayReservations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No reservations today.
                </p>
              ) : (
                <div className="space-y-2">
                  {todayReservations.slice(0, 8).map((res) => (
                    <Link
                      key={res.id}
                      href={`/${orgSlug}/reservations/${res.id}`}
                      className="flex items-center justify-between rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-muted-foreground w-12">
                          {format(new Date(res.date), "HH:mm")}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{res.guestName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {res.partySize}
                            {res.tables.length > 0 && (
                              <span className="ml-1">
                                · {res.tables.map((rt) => rt.table.name).join(", ")}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={res.status} />
                    </Link>
                  ))}
                  {todayReservations.length > 8 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">
                      +{todayReservations.length - 8} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Upcoming (next 7 days)</CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href={`/${orgSlug}/reservations`}>
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingReservations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No upcoming reservations.
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingReservations.map((res) => (
                    <Link
                      key={res.id}
                      href={`/${orgSlug}/reservations/${res.id}`}
                      className="flex items-center justify-between rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center w-10">
                          <p className="text-xs font-medium text-muted-foreground">
                            {format(new Date(res.date), "EEE")}
                          </p>
                          <p className="text-sm font-bold">
                            {format(new Date(res.date), "d")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{res.guestName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(res.date), "HH:mm")} · {res.partySize} guests
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={res.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/table-plan?date=${format(today, "yyyy-MM-dd")}`}>
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Today&apos;s Table Plan
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/reservations?view=timeslot&date=${format(today, "yyyy-MM-dd")}`}>
              <Clock className="h-4 w-4 mr-2" />
              Time Slot View
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/settings/tables`}>
              <CalendarDays className="h-4 w-4 mr-2" />
              Manage Tables
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
