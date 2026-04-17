import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { WebBookingForm } from "@/components/widget/WebBookingForm"

export default async function BookingWidgetPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      settings: true,
      diningAreas: {
        where: { isActive: true },
        include: {
          tables: {
            where: { isActive: true },
            select: { id: true, capacity: true },
          },
        },
      },
    },
  })

  if (!org) notFound()

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">Book a table</p>
        </div>
        <WebBookingForm orgSlug={orgSlug} settings={org.settings} />
      </div>
    </div>
  )
}
