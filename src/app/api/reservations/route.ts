import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { generateReservationNumber } from "@/lib/reservation-number"
import { ReservationSource, ReservationStatus } from "@/generated/prisma"

const schema = z.object({
  orgSlug: z.string().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email().optional().or(z.literal("")).or(z.undefined()),
  guestPhone: z.string().optional(),
  partySize: z.coerce.number().int().min(1).max(100),
  date: z.string().min(1),
  time: z.string().min(1),
  specialRequests: z.string().optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    )
  }

  const { orgSlug, date, time, guestEmail, partySize, ...rest } = parsed.data

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: { settings: true },
  })

  if (!org) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
  }

  if (partySize > (org.settings?.maxPartySize ?? 20)) {
    return NextResponse.json(
      { error: `Maximum party size is ${org.settings?.maxPartySize ?? 20}` },
      { status: 400 }
    )
  }

  const dateTime = new Date(`${date}T${time}:00`)
  if (isNaN(dateTime.getTime())) {
    return NextResponse.json({ error: "Invalid date or time" }, { status: 400 })
  }

  const reservationNumber = await generateReservationNumber(org.id)
  const durationMins = org.settings?.defaultResDurationMins ?? 90

  const reservation = await prisma.reservation.create({
    data: {
      organizationId: org.id,
      reservationNumber,
      date: dateTime,
      durationMins,
      guestEmail: guestEmail || null,
      partySize,
      source: ReservationSource.WEB_FORM,
      status: ReservationStatus.CONFIRMED,
      ...rest,
    },
  })

  return NextResponse.json({ reservationNumber: reservation.reservationNumber }, { status: 201 })
}
