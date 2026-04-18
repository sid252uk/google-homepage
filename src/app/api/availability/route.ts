import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ReservationStatus } from "@/generated/prisma"
import { startOfDay, endOfDay, parse, format, addMinutes, isAfter, isBefore } from "date-fns"

// GET /api/availability?orgSlug=X&date=YYYY-MM-DD&partySize=N
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const orgSlug = searchParams.get("orgSlug")
  const dateStr = searchParams.get("date")
  const partySizeStr = searchParams.get("partySize")

  if (!orgSlug || !dateStr || !partySizeStr) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  const partySize = parseInt(partySizeStr, 10)
  if (isNaN(partySize) || partySize < 1) {
    return NextResponse.json({ error: "Invalid partySize" }, { status: 400 })
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: { settings: true },
  })

  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const settings = org.settings
  const openingTime = settings?.openingTime ?? "09:00"
  const closingTime = settings?.closingTime ?? "23:00"
  const slotInterval = settings?.slotIntervalMins ?? 15
  const duration = settings?.defaultResDurationMins ?? 90

  // Tables that can fit the party
  const eligibleTables = await prisma.table.findMany({
    where: { organizationId: org.id, isActive: true, capacity: { gte: partySize } },
    select: { id: true },
  })

  if (eligibleTables.length === 0) {
    return NextResponse.json({ slots: [], duration })
  }

  const tableIds = eligibleTables.map((t) => t.id)

  // All non-cancelled reservations that day (any of the eligible tables)
  const baseDate = new Date(`${dateStr}T00:00:00`)
  const reservations = await prisma.reservation.findMany({
    where: {
      organizationId: org.id,
      date: { gte: startOfDay(baseDate), lte: endOfDay(baseDate) },
      status: {
        notIn: [ReservationStatus.CANCELED, ReservationStatus.NO_SHOW],
      },
      tables: { some: { tableId: { in: tableIds } } },
    },
    include: { tables: { select: { tableId: true } } },
  })

  // Build slots
  const openAt = parse(openingTime, "HH:mm", baseDate)
  const closeAt = parse(closingTime, "HH:mm", baseDate)
  const slots: string[] = []
  let cursor = openAt

  while (isBefore(cursor, closeAt)) {
    const slotStart = cursor
    const slotEnd = addMinutes(slotStart, duration)

    // Can't start a slot that would end after closing time
    if (isAfter(slotEnd, closeAt)) break

    // Check if at least one eligible table is free for this slot
    const available = tableIds.some((tableId) => {
      const conflicting = reservations.filter((r) => {
        if (!r.tables.some((rt) => rt.tableId === tableId)) return false
        const resStart = r.date
        const resEnd = addMinutes(resStart, r.durationMins)
        // Overlap: resStart < slotEnd AND resEnd > slotStart
        return isBefore(resStart, slotEnd) && isAfter(resEnd, slotStart)
      })
      return conflicting.length === 0
    })

    if (available) {
      slots.push(format(slotStart, "HH:mm"))
    }

    cursor = addMinutes(cursor, slotInterval)
  }

  return NextResponse.json({ slots, duration, slotInterval })
}
