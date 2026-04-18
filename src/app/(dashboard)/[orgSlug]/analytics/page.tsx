import { Header } from "@/components/layout/Header"
import { requireOrgAccess } from "@/lib/auth"
import { getSubscriptionPlan, hasModule } from "@/lib/subscription"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReservationStatus, ReservationSource } from "@/generated/prisma"
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns"
import { Lock } from "lucide-react"
import Link from "next/link"
import { AnalyticsCharts } from "./AnalyticsCharts"

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const org = await requireOrgAccess(orgSlug)
  const plan = await getSubscriptionPlan(org.id)
  const canView = hasModule(plan, "analytics")

  if (!canView) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="Analytics" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center max-w-md">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analytics — Enterprise Feature</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Upgrade to Enterprise to unlock detailed analytics including reservation trends,
              source breakdown, covers over time, and peak hour analysis.
            </p>
            <Button asChild>
              <Link href={`/${orgSlug}/settings/billing`}>Upgrade to Enterprise</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()
  const thirtyDaysAgo = startOfDay(subDays(now, 29))

  const [reservations, totalThisMonth, totalLastMonth] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        organizationId: org.id,
        date: { gte: thirtyDaysAgo },
      },
      select: {
        date: true,
        status: true,
        source: true,
        partySize: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.reservation.count({
      where: {
        organizationId: org.id,
        date: { gte: startOfDay(subDays(now, 29)) },
        status: { notIn: [ReservationStatus.CANCELED, ReservationStatus.NO_SHOW] },
      },
    }),
    prisma.reservation.count({
      where: {
        organizationId: org.id,
        date: {
          gte: startOfDay(subDays(now, 59)),
          lt: startOfDay(subDays(now, 29)),
        },
        status: { notIn: [ReservationStatus.CANCELED, ReservationStatus.NO_SHOW] },
      },
    }),
  ])

  // Daily reservation counts for last 30 days
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: startOfDay(now) })
  const dailyCounts = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd")
    const count = reservations.filter(
      (r) =>
        format(new Date(r.date), "yyyy-MM-dd") === dayStr &&
        r.status !== ReservationStatus.CANCELED &&
        r.status !== ReservationStatus.NO_SHOW
    ).length
    const covers = reservations
      .filter(
        (r) =>
          format(new Date(r.date), "yyyy-MM-dd") === dayStr &&
          r.status !== ReservationStatus.CANCELED &&
          r.status !== ReservationStatus.NO_SHOW
      )
      .reduce((sum, r) => sum + r.partySize, 0)
    return { date: format(day, "MMM d"), count, covers }
  })

  // Source breakdown
  const sourceCounts = Object.values(ReservationSource).map((source) => ({
    source,
    count: reservations.filter((r) => r.source === source).length,
  })).filter((s) => s.count > 0)

  // Status breakdown
  const statusCounts = Object.values(ReservationStatus).map((status) => ({
    status,
    count: reservations.filter((r) => r.status === status).length,
  })).filter((s) => s.count > 0)

  // Hour distribution
  const hourCounts = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 9
    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      count: reservations.filter((r) => new Date(r.date).getHours() === hour).length,
    }
  })

  const totalCovers = reservations
    .filter((r) => r.status !== ReservationStatus.CANCELED && r.status !== ReservationStatus.NO_SHOW)
    .reduce((sum, r) => sum + r.partySize, 0)

  const noShowRate = reservations.length > 0
    ? Math.round((reservations.filter((r) => r.status === ReservationStatus.NO_SHOW).length / reservations.length) * 100)
    : 0

  const cancelRate = reservations.length > 0
    ? Math.round((reservations.filter((r) => r.status === ReservationStatus.CANCELED).length / reservations.length) * 100)
    : 0

  const pctChange = totalLastMonth > 0
    ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100)
    : 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Analytics" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Reservations (30d)</p>
              <p className="text-3xl font-bold mt-1">{totalThisMonth}</p>
              <p className={`text-xs mt-1 ${pctChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                {pctChange >= 0 ? "+" : ""}{pctChange}% vs prev 30d
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Covers (30d)</p>
              <p className="text-3xl font-bold mt-1">{totalCovers}</p>
              <p className="text-xs text-muted-foreground mt-1">guests served</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">No-show Rate</p>
              <p className="text-3xl font-bold mt-1">{noShowRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Cancellation Rate</p>
              <p className="text-3xl font-bold mt-1">{cancelRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <AnalyticsCharts
          dailyCounts={dailyCounts}
          sourceCounts={sourceCounts}
          statusCounts={statusCounts}
          hourCounts={hourCounts}
        />
      </div>
    </div>
  )
}
