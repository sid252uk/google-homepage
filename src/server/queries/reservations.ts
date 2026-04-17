import { prisma } from "@/lib/prisma"
import { ReservationStatus, ReservationSource } from "@/generated/prisma"
import { startOfDay, endOfDay } from "date-fns"

export async function getReservations(
  organizationId: string,
  filters: {
    date?: Date
    status?: ReservationStatus
    source?: ReservationSource
    search?: string
  } = {}
) {
  const { date, status, source, search } = filters

  return prisma.reservation.findMany({
    where: {
      organizationId,
      ...(date && {
        date: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
      }),
      ...(status && { status }),
      ...(source && { source }),
      ...(search && {
        OR: [
          { guestName: { contains: search, mode: "insensitive" } },
          { guestEmail: { contains: search, mode: "insensitive" } },
          { guestPhone: { contains: search, mode: "insensitive" } },
          { reservationNumber: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      tables: {
        include: { table: true },
      },
    },
    orderBy: { date: "asc" },
  })
}

export async function getReservationById(id: string, organizationId: string) {
  return prisma.reservation.findFirst({
    where: { id, organizationId },
    include: {
      tables: { include: { table: { include: { diningArea: true } } } },
      auditLog: { orderBy: { performedAt: "desc" }, take: 20 },
    },
  })
}

export async function getReservationsForTablePlan(
  organizationId: string,
  date: Date
) {
  const areas = await prisma.diningArea.findMany({
    where: { organizationId, isActive: true },
    include: {
      tables: {
        where: { isActive: true },
        include: {
          reservations: {
            where: {
              reservation: {
                organizationId,
                date: {
                  gte: startOfDay(date),
                  lte: endOfDay(date),
                },
                status: {
                  notIn: [ReservationStatus.CANCELED, ReservationStatus.NO_SHOW],
                },
              },
            },
            include: {
              reservation: true,
            },
          },
        },
        orderBy: [{ posY: "asc" }, { posX: "asc" }],
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  const assignedIds = new Set(
    areas
      .flatMap((a) => a.tables)
      .flatMap((t) => t.reservations)
      .map((rt) => rt.reservationId)
  )

  const unassigned = await prisma.reservation.findMany({
    where: {
      organizationId,
      date: { gte: startOfDay(date), lte: endOfDay(date) },
      status: { notIn: [ReservationStatus.CANCELED, ReservationStatus.NO_SHOW] },
      tables: { none: {} },
    },
    orderBy: { date: "asc" },
  })

  const allUnassigned = await prisma.reservation.findMany({
    where: {
      organizationId,
      date: { gte: startOfDay(date), lte: endOfDay(date) },
      status: { notIn: [ReservationStatus.CANCELED, ReservationStatus.NO_SHOW] },
      id: { notIn: [...assignedIds] },
    },
    orderBy: { date: "asc" },
  })

  return { areas, unassigned: allUnassigned }
}
