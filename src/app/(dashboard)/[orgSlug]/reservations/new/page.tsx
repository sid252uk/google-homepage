import { Header } from "@/components/layout/Header"
import { ReservationForm } from "@/components/reservations/ReservationForm"
import { requireOrgAccess } from "@/lib/auth"

export default async function NewReservationPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  await requireOrgAccess(orgSlug)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="New Reservation" />
      <div className="flex-1 overflow-auto p-6">
        <ReservationForm orgSlug={orgSlug} />
      </div>
    </div>
  )
}
