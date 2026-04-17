import { Header } from "@/components/layout/Header"
import { TablePlanCanvas } from "@/components/table-plan/TablePlanCanvas"
import { requireOrgAccess } from "@/lib/auth"
import { getReservationsForTablePlan } from "@/server/queries/reservations"
import { getSubscriptionPlan, hasModule } from "@/lib/subscription"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface PageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ date?: string }>
}

export default async function TablePlanPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params
  const sp = await searchParams

  const org = await requireOrgAccess(orgSlug)
  const plan = await getSubscriptionPlan(org.id)

  const canView = hasModule(plan, "table_plan:view")
  const canDragDrop = hasModule(plan, "table_plan:drag_drop")

  if (!canView) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="Table Plan" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-md">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Table Plan</h2>
            <p className="text-muted-foreground mt-2">
              The table plan is available on all plans. Please contact support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const date = sp.date ? new Date(sp.date) : new Date()
  const { areas, unassigned } = await getReservationsForTablePlan(org.id, date)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title="Table Plan"
        actions={
          <div className="flex items-center gap-3">
            {!canDragDrop && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Read-only —</span>
                <Link href={`/${orgSlug}/settings/billing`} className="text-primary hover:underline">
                  Upgrade for drag-and-drop
                </Link>
              </div>
            )}
            <form>
              <Input
                type="date"
                name="date"
                defaultValue={format(date, "yyyy-MM-dd")}
                className="w-40"
                onChange={(e) => {
                  const url = new URL(window.location.href)
                  url.searchParams.set("date", e.target.value)
                  window.location.href = url.toString()
                }}
              />
            </form>
          </div>
        }
      />
      <div className="flex-1 overflow-hidden">
        <TablePlanCanvas
          areas={areas}
          unassigned={unassigned}
          orgSlug={orgSlug}
          date={date}
          canDragDrop={canDragDrop}
        />
      </div>
    </div>
  )
}
