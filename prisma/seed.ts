import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import {
  ReservationStatus,
  ReservationSource,
  SubscriptionPlan,
  SubscriptionStatus,
  TableShape,
} from "../src/generated/prisma/enums"
import { addDays, addHours, startOfDay, setHours, setMinutes } from "date-fns"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const FIRST_NAMES = ["James", "Emma", "Oliver", "Sophia", "Liam", "Olivia", "Noah", "Ava", "William", "Isabella", "Benjamin", "Mia", "Elijah", "Charlotte", "Lucas", "Amelia", "Mason", "Harper", "Logan", "Evelyn"]
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Lee", "Clark"]
const OCCASIONS = [null, null, null, "Birthday", "Anniversary", "Business dinner", "Date night", null, null, "Graduation"]
const SOURCES: ReservationSource[] = ["TELEPHONE", "TELEPHONE", "IN_PERSON", "WEB_FORM", "EMAIL", "SOCIAL_MEDIA", "WALKIN"]
const STATUSES: ReservationStatus[] = ["CONFIRMED", "CONFIRMED", "CONFIRMED", "INQUIRY", "WAITLISTED"]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function reservationTime(date: Date, hour: number, minuteOffset = 0): Date {
  return setMinutes(setHours(startOfDay(date), hour), minuteOffset)
}

async function main() {
  console.log("🌱 Seeding database…")

  // Clean up existing seed data
  await prisma.reservationAuditLog.deleteMany({})
  await prisma.reservationTable.deleteMany({})
  await prisma.reservation.deleteMany({})
  await prisma.table.deleteMany({})
  await prisma.diningArea.deleteMany({})
  await prisma.organizationSettings.deleteMany({})
  await prisma.organizationMember.deleteMany({})
  await prisma.subscription.deleteMany({})
  await prisma.organization.deleteMany({ where: { slug: "demo-restaurant" } })

  // Create org
  const org = await prisma.organization.create({
    data: {
      clerkOrgId: "seed_org_demo",
      name: "The Grand Bistro",
      slug: "demo-restaurant",
      timezone: "Europe/London",
      currency: "GBP",
      phone: "+44 20 7946 0958",
      email: "hello@grandbistro.example",
      address: "12 Victoria Street, London, SW1H 0NE",
    },
  })

  // Subscription
  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: addDays(new Date(), 30),
    },
  })

  // Settings
  await prisma.organizationSettings.create({
    data: {
      organizationId: org.id,
      openingTime: "12:00",
      closingTime: "22:30",
      slotIntervalMins: 15,
      defaultResDurationMins: 90,
      maxPartySize: 12,
      confirmationEmailEnabled: true,
      reminderEmailEnabled: true,
      reminderHoursBefore: 24,
      customTerms: "48 hours cancellation notice required. Deposits non-refundable.",
    },
  })

  // ── Dining areas ──────────────────────────────────────
  const mainFloor = await prisma.diningArea.create({
    data: { organizationId: org.id, name: "Main Floor", sortOrder: 0 },
  })
  const patio = await prisma.diningArea.create({
    data: { organizationId: org.id, name: "Patio", sortOrder: 1 },
  })
  const privateRoom = await prisma.diningArea.create({
    data: { organizationId: org.id, name: "Private Room", sortOrder: 2 },
  })

  // ── Tables ────────────────────────────────────────────
  const mainTables = await Promise.all(
    [
      { name: "M1", capacity: 2, minCapacity: 1, posX: 0, posY: 0, shape: TableShape.SQUARE },
      { name: "M2", capacity: 2, minCapacity: 1, posX: 1, posY: 0, shape: TableShape.SQUARE },
      { name: "M3", capacity: 4, minCapacity: 2, posX: 2, posY: 0, shape: TableShape.RECTANGLE },
      { name: "M4", capacity: 4, minCapacity: 2, posX: 3, posY: 0, shape: TableShape.RECTANGLE },
      { name: "M5", capacity: 6, minCapacity: 3, posX: 0, posY: 1, shape: TableShape.RECTANGLE },
      { name: "M6", capacity: 6, minCapacity: 3, posX: 2, posY: 1, shape: TableShape.RECTANGLE },
      { name: "M7", capacity: 8, minCapacity: 4, posX: 0, posY: 2, shape: TableShape.RECTANGLE },
    ].map((t) =>
      prisma.table.create({
        data: { organizationId: org.id, diningAreaId: mainFloor.id, ...t },
      })
    )
  )

  const patioTables = await Promise.all(
    [
      { name: "P1", capacity: 2, minCapacity: 1, posX: 0, posY: 0, shape: TableShape.CIRCLE },
      { name: "P2", capacity: 2, minCapacity: 1, posX: 1, posY: 0, shape: TableShape.CIRCLE },
      { name: "P3", capacity: 4, minCapacity: 2, posX: 2, posY: 0, shape: TableShape.CIRCLE },
      { name: "P4", capacity: 4, minCapacity: 2, posX: 3, posY: 0, shape: TableShape.CIRCLE },
    ].map((t) =>
      prisma.table.create({
        data: { organizationId: org.id, diningAreaId: patio.id, ...t },
      })
    )
  )

  const privateTables = await Promise.all(
    [
      { name: "PR1", capacity: 10, minCapacity: 6, posX: 0, posY: 0, shape: TableShape.OVAL },
      { name: "PR2", capacity: 12, minCapacity: 8, posX: 0, posY: 1, shape: TableShape.RECTANGLE },
    ].map((t) =>
      prisma.table.create({
        data: { organizationId: org.id, diningAreaId: privateRoom.id, ...t },
      })
    )
  )

  const allTables = [...mainTables, ...patioTables, ...privateTables]

  // ── Reservations ─────────────────────────────────────
  const today = startOfDay(new Date())
  let resCount = 0

  const SERVICE_TIMES = [12, 13, 14, 19, 20, 21]

  for (let dayOffset = -3; dayOffset <= 10; dayOffset++) {
    const date = addDays(today, dayOffset)
    const recsThisDay = randInt(4, 12)

    for (let r = 0; r < recsThisDay; r++) {
      const hour = pick(SERVICE_TIMES)
      const minute = pick([0, 15, 30, 45])
      const resDate = reservationTime(date, hour, minute)

      const firstName = pick(FIRST_NAMES)
      const lastName = pick(LAST_NAMES)
      const partySize = randInt(1, 6)
      const source = pick(SOURCES)

      let status: ReservationStatus
      if (dayOffset < 0) {
        status = pick(["COMPLETED", "COMPLETED", "NO_SHOW", "CANCELED"] as ReservationStatus[])
      } else if (dayOffset === 0) {
        status = pick(["CONFIRMED", "CONFIRMED", "SEATED", "CONFIRMED"] as ReservationStatus[])
      } else {
        status = pick(STATUSES)
      }

      const durationMins = pick([60, 75, 90, 90, 105, 120])
      const occasion = pick(OCCASIONS)

      const reservation = await prisma.reservation.create({
        data: {
          organizationId: org.id,
          reservationNumber: `RES-${String(++resCount).padStart(4, "0")}`,
          guestName: `${firstName} ${lastName}`,
          guestEmail: Math.random() > 0.3 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com` : null,
          guestPhone: Math.random() > 0.4 ? `+44 7${randInt(100, 999)} ${randInt(100000, 999999)}` : null,
          partySize,
          date: resDate,
          durationMins,
          source,
          status,
          occasion: occasion ?? undefined,
          notes: Math.random() > 0.7 ? "Regular guest — prefers window table." : undefined,
          specialRequests: Math.random() > 0.8 ? "Gluten-free menu required." : undefined,
          confirmedAt: status !== "INQUIRY" && status !== "WAITLISTED" ? resDate : undefined,
          seatedAt: status === "SEATED" || status === "COMPLETED" ? addHours(resDate, 0) : undefined,
          completedAt: status === "COMPLETED" ? addHours(resDate, durationMins / 60) : undefined,
          canceledAt: status === "CANCELED" ? addDays(resDate, -1) : undefined,
          noShowAt: status === "NO_SHOW" ? addHours(resDate, 0.25) : undefined,
        },
      })

      // Assign to a table (not for canceled/no-show)
      if (status !== "CANCELED" && status !== "NO_SHOW" && Math.random() > 0.2) {
        const eligibleTables = allTables.filter((t) => t.capacity >= partySize)
        if (eligibleTables.length > 0) {
          const table = pick(eligibleTables)
          await prisma.reservationTable.create({
            data: { reservationId: reservation.id, tableId: table.id },
          })
        }
      }

      await prisma.reservationAuditLog.create({
        data: {
          reservationId: reservation.id,
          action: "created",
          newValue: { status, source },
        },
      })
    }
  }

  console.log(`✅ Seeded org "${org.name}" (slug: ${org.slug})`)
  console.log(`   ${allTables.length} tables across 3 areas`)
  console.log(`   ${resCount} reservations over 14 days`)
  console.log(`\n   To use: set clerkOrgId to your actual Clerk org ID in the DB`)
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
