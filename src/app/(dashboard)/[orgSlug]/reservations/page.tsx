import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListView } from "@/components/reservations/views/ListView"
import { TimeSlotView } from "@/components/reservations/views/TimeSlotView"
import { CalendarView } from "@/components/reservations/views/CalendarView"
import { requireOrgAccess } from "@/lib/auth"
import { getReservations } from "@/server/queries/reservations"
import { getSubscriptionPlan, hasModule } from "@/lib/subscription"
import { ReservationStatus, ReservationSource, SubscriptionPlan } from "@/generated/prisma"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Lock } from "lucide-react"
import type { ReservationWithTables } from "@/types"

interface PageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{
    view?: string
    date?: string
    status?: string
    source?: string
    search?: string
  }>
}

export default async function ReservationsPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params
  const sp = await searchParams

  const org = await requireOrgAccess(orgSlug)
  const plan = await getSubscriptionPlan(org.id)

  const date = sp.date ? new Date(sp.date) : new Date()
  const view = sp.view ?? "list"

  const reservations = await getReservations(org.id, {
    date: sp.date ? new Date(sp.date) : undefined,
    status: sp.status as ReservationStatus | undefined,
    source: sp.source as ReservationSource | undefined,
    search: sp.search,
  }) as ReservationWithTables[]

  const tables = await prisma.table.findMany({
    where: { organizationId: org.id, isActive: true },
    orderBy: [{ diningArea: { sortOrder: "asc" } }, { name: "asc" }],
  })

  const canSeeTimeslot = hasModule(plan, "views:timeslot")
  const canSeeCalendar = hasModule(plan, "views:calendar")

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="Reservations"
        actions={
          <Button asChild size="sm">
            <Link href={`/${orgSlug}/reservations/new`}>
              <Plus className="h-4 w-4" />
              New Reservation
            </Link>
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Mobile: always show list view only */}
        <div className="sm:hidden">
          <ListView reservations={reservations} orgSlug={orgSlug} selectedDate={sp.date} />
        </div>

        {/* Desktop: full tab switcher */}
        <div className="hidden sm:block">
        <Tabs defaultValue={view}>
          <TabsList className="mb-4">
            <TabsTrigger value="list" asChild>
              <Link href={`?view=list${sp.date ? `&date=${sp.date}` : ""}`}>List</Link>
            </TabsTrigger>
            <TabsTrigger value="timeslot" disabled={!canSeeTimeslot} asChild>
              <Link href={canSeeTimeslot ? `?view=timeslot${sp.date ? `&date=${sp.date}` : ""}` : "#"}>
                {!canSeeTimeslot && <Lock className="h-3 w-3 mr-1" />}
                Time Slots
              </Link>
            </TabsTrigger>
            <TabsTrigger value="calendar" disabled={!canSeeCalendar} asChild>
              <Link href={canSeeCalendar ? `?view=calendar${sp.date ? `&date=${sp.date}` : ""}` : "#"}>
                {!canSeeCalendar && <Lock className="h-3 w-3 mr-1" />}
                Calendar
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <ListView reservations={reservations} orgSlug={orgSlug} selectedDate={sp.date} />
          </TabsContent>

          <TabsContent value="timeslot">
            {canSeeTimeslot ? (
              <TimeSlotView reservations={reservations} tables={tables} orgSlug={orgSlug} date={date} />
            ) : (
              <div className="rounded-lg border-2 border-dashed p-12 text-center">
                <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="font-semibold">Time Slot View — Pro Feature</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade to Pro to unlock the time slot view.
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link href={`/${orgSlug}/settings/billing`}>Upgrade to Pro</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            {canSeeCalendar ? (
              <CalendarView reservations={reservations} orgSlug={orgSlug} selectedDate={sp.date} />
            ) : (
              <div className="rounded-lg border-2 border-dashed p-12 text-center">
                <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="font-semibold">Calendar View — Pro Feature</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href={`/${orgSlug}/settings/billing`}>Upgrade to Pro</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}
