import { prisma } from "@/lib/prisma"
import { sendReminderEmail } from "@/lib/email"
import { ReservationStatus, SubscriptionPlan } from "@/generated/prisma"
import { startOfDay, endOfDay, addDays } from "date-fns"

// Called daily by Vercel Cron (configure in vercel.json) or any external scheduler.
// Requires CRON_SECRET header to prevent unauthorised calls.
export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorised", { status: 401 })
  }

  const tomorrow = addDays(new Date(), 1)
  const tomorrowStart = startOfDay(tomorrow)
  const tomorrowEnd = endOfDay(tomorrow)

  // Only send reminders for orgs on Pro or Enterprise with reminder emails enabled
  const eligibleOrgs = await prisma.organization.findMany({
    where: {
      subscription: {
        plan: { in: [SubscriptionPlan.PRO, SubscriptionPlan.ENTERPRISE] },
      },
      settings: { reminderEmailEnabled: true },
    },
    select: { id: true, name: true },
  })

  if (eligibleOrgs.length === 0) {
    return Response.json({ sent: 0, message: "No eligible orgs" })
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      organizationId: { in: eligibleOrgs.map((o) => o.id) },
      date: { gte: tomorrowStart, lte: tomorrowEnd },
      status: {
        in: [ReservationStatus.CONFIRMED, ReservationStatus.WAITLISTED],
      },
      guestEmail: { not: null },
    },
    select: {
      id: true,
      organizationId: true,
      guestName: true,
      guestEmail: true,
      reservationNumber: true,
      date: true,
      partySize: true,
      durationMins: true,
      specialRequests: true,
      occasion: true,
    },
  })

  const orgMap = Object.fromEntries(eligibleOrgs.map((o) => [o.id, o.name]))
  let sent = 0

  await Promise.allSettled(
    reservations.map(async (res) => {
      if (!res.guestEmail) return
      await sendReminderEmail({
        orgName: orgMap[res.organizationId] ?? "The Restaurant",
        guestName: res.guestName,
        guestEmail: res.guestEmail,
        reservationNumber: res.reservationNumber,
        date: res.date,
        partySize: res.partySize,
        durationMins: res.durationMins,
        specialRequests: res.specialRequests,
        occasion: res.occasion,
      })
      sent++
    })
  )

  return Response.json({ sent, total: reservations.length })
}
