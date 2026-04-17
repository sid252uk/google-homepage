import { notFound } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { ReservationForm } from "@/components/reservations/ReservationForm"
import { StatusBadge, SourceBadge } from "@/components/reservations/StatusBadge"
import { requireOrgAccess } from "@/lib/auth"
import { getReservationById } from "@/server/queries/reservations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>
}) {
  const { orgSlug, id } = await params
  const org = await requireOrgAccess(orgSlug)
  const reservation = await getReservationById(id, org.id)

  if (!reservation) notFound()

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header
        title={reservation.reservationNumber}
        actions={
          <div className="flex items-center gap-2">
            <SourceBadge source={reservation.source} />
            <StatusBadge status={reservation.status} />
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ReservationForm orgSlug={orgSlug} reservation={reservation} />
          </div>
          <div className="space-y-4">
            {/* Audit log */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                {reservation.auditLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {reservation.auditLog.map((log) => (
                      <div key={log.id} className="text-xs">
                        <p className="font-medium capitalize">
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-muted-foreground">
                          {format(new Date(log.performedAt), "d MMM yyyy HH:mm")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned tables */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Assigned Tables</CardTitle>
              </CardHeader>
              <CardContent>
                {reservation.tables.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Not yet assigned to a table. Use the Table Plan to assign.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {reservation.tables.map((rt) => (
                      <div key={rt.tableId} className="text-sm flex items-center justify-between">
                        <span>{rt.table.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {rt.table.diningArea?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
