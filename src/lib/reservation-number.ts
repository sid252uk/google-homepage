import { format } from "date-fns"
import { prisma } from "@/lib/prisma"

export async function generateReservationNumber(organizationId: string): Promise<string> {
  const datePrefix = format(new Date(), "yyyyMMdd")
  const count = await prisma.reservation.count({
    where: {
      organizationId,
      reservationNumber: { startsWith: `RES-${datePrefix}` },
    },
  })
  return `RES-${datePrefix}-${String(count + 1).padStart(4, "0")}`
}
