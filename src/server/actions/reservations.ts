"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireOrgAccess } from "@/lib/auth"
import { generateReservationNumber } from "@/lib/reservation-number"
import { ReservationStatus, ReservationSource } from "@/generated/prisma"

const reservationSchema = z.object({
  guestName: z.string().min(1, "Guest name is required"),
  guestEmail: z.string().email().optional().or(z.literal("")),
  guestPhone: z.string().optional(),
  partySize: z.coerce.number().int().min(1).max(100),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  durationMins: z.coerce.number().int().min(30).default(90),
  source: z.nativeEnum(ReservationSource),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  dietaryNotes: z.string().optional(),
  occasion: z.string().optional(),
})

export async function createReservation(orgSlug: string, formData: FormData) {
  const { userId } = await auth()
  const org = await requireOrgAccess(orgSlug)

  const raw = Object.fromEntries(formData.entries())
  const parsed = reservationSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data" }
  }

  const { date, time, guestEmail, ...rest } = parsed.data
  const dateTime = new Date(`${date}T${time}:00`)
  const reservationNumber = await generateReservationNumber(org.id)

  const reservation = await prisma.reservation.create({
    data: {
      organizationId: org.id,
      reservationNumber,
      date: dateTime,
      guestEmail: guestEmail || null,
      createdByUserId: userId ?? undefined,
      ...rest,
    },
  })

  await prisma.reservationAuditLog.create({
    data: {
      reservationId: reservation.id,
      action: "created",
      newValue: { status: reservation.status, source: reservation.source },
      performedBy: userId ?? undefined,
    },
  })

  revalidatePath(`/${orgSlug}/reservations`)
  return { success: true, id: reservation.id }
}

export async function updateReservation(
  orgSlug: string,
  reservationId: string,
  formData: FormData
) {
  const { userId } = await auth()
  const org = await requireOrgAccess(orgSlug)

  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, organizationId: org.id },
  })
  if (!existing) return { error: "Reservation not found" }

  const raw = Object.fromEntries(formData.entries())
  const parsed = reservationSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data" }
  }

  const { date, time, guestEmail, ...rest } = parsed.data
  const dateTime = new Date(`${date}T${time}:00`)

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      date: dateTime,
      guestEmail: guestEmail || null,
      ...rest,
    },
  })

  await prisma.reservationAuditLog.create({
    data: {
      reservationId,
      action: "updated",
      previousValue: { date: existing.date, partySize: existing.partySize },
      newValue: { date: updated.date, partySize: updated.partySize },
      performedBy: userId ?? undefined,
    },
  })

  revalidatePath(`/${orgSlug}/reservations`)
  revalidatePath(`/${orgSlug}/reservations/${reservationId}`)
  return { success: true }
}

export async function updateReservationStatus(
  orgSlug: string,
  reservationId: string,
  status: ReservationStatus
) {
  const { userId } = await auth()
  const org = await requireOrgAccess(orgSlug)

  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, organizationId: org.id },
  })
  if (!existing) return { error: "Reservation not found" }

  const timestamps: Partial<Record<string, Date | null>> = {}
  if (status === ReservationStatus.CONFIRMED) timestamps.confirmedAt = new Date()
  if (status === ReservationStatus.SEATED) timestamps.seatedAt = new Date()
  if (status === ReservationStatus.COMPLETED) timestamps.completedAt = new Date()
  if (status === ReservationStatus.CANCELED) timestamps.canceledAt = new Date()
  if (status === ReservationStatus.NO_SHOW) timestamps.noShowAt = new Date()

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status, ...timestamps },
  })

  await prisma.reservationAuditLog.create({
    data: {
      reservationId,
      action: "status_changed",
      previousValue: { status: existing.status },
      newValue: { status },
      performedBy: userId ?? undefined,
    },
  })

  revalidatePath(`/${orgSlug}/reservations`)
  revalidatePath(`/${orgSlug}/reservations/${reservationId}`)
  revalidatePath(`/${orgSlug}/table-plan`)
  return { success: true }
}

export async function assignReservationToTable(
  orgSlug: string,
  reservationId: string,
  tableId: string | null
) {
  const { userId } = await auth()
  const org = await requireOrgAccess(orgSlug)

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, organizationId: org.id },
  })
  if (!reservation) return { error: "Reservation not found" }

  if (tableId === null) {
    await prisma.reservationTable.deleteMany({ where: { reservationId } })
  } else {
    const table = await prisma.table.findFirst({
      where: { id: tableId, organizationId: org.id },
    })
    if (!table) return { error: "Table not found" }

    await prisma.reservationTable.deleteMany({ where: { reservationId } })
    await prisma.reservationTable.create({
      data: { reservationId, tableId, assignedBy: userId ?? undefined },
    })
  }

  await prisma.reservationAuditLog.create({
    data: {
      reservationId,
      action: "table_assigned",
      newValue: { tableId },
      performedBy: userId ?? undefined,
    },
  })

  revalidatePath(`/${orgSlug}/table-plan`)
  return { success: true }
}

export async function deleteReservation(orgSlug: string, reservationId: string) {
  const org = await requireOrgAccess(orgSlug)

  await prisma.reservation.delete({
    where: { id: reservationId, organizationId: org.id },
  })

  revalidatePath(`/${orgSlug}/reservations`)
  return { success: true }
}
