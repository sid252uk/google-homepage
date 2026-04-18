"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireOrgAccess } from "@/lib/auth"
import { z } from "zod"

const orgProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
})

const orgSettingsSchema = z.object({
  openingTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  slotIntervalMins: z.coerce.number().int().min(5).max(120),
  defaultResDurationMins: z.coerce.number().int().min(15).max(480),
  maxPartySize: z.coerce.number().int().min(1).max(200),
  requireDeposit: z.string().optional().transform((v) => v === "on" || v === "true"),
  depositAmount: z.coerce.number().optional(),
  reminderHoursBefore: z.coerce.number().int().min(1).max(72),
  confirmationEmailEnabled: z.string().optional().transform((v) => v === "on" || v === "true"),
  reminderEmailEnabled: z.string().optional().transform((v) => v === "on" || v === "true"),
  widgetPrimaryColor: z.string().optional(),
  customTerms: z.string().optional(),
})

export async function updateOrgProfile(orgSlug: string, formData: FormData) {
  const org = await requireOrgAccess(orgSlug)
  const parsed = orgProfileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const { email, ...rest } = parsed.data
  await prisma.organization.update({
    where: { id: org.id },
    data: { email: email || null, ...rest },
  })

  revalidatePath(`/${orgSlug}/settings/general`)
  return { success: true }
}

export async function updateOrgSettings(orgSlug: string, formData: FormData) {
  const org = await requireOrgAccess(orgSlug)
  const parsed = orgSettingsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    update: parsed.data,
    create: { organizationId: org.id, ...parsed.data },
  })

  revalidatePath(`/${orgSlug}/settings/general`)
  return { success: true }
}

const areaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
})

export async function createArea(orgSlug: string, formData: FormData) {
  const org = await requireOrgAccess(orgSlug)
  const parsed = areaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  await prisma.diningArea.create({
    data: { organizationId: org.id, ...parsed.data },
  })

  revalidatePath(`/${orgSlug}/settings/tables`)
  return { success: true }
}

export async function updateArea(
  orgSlug: string,
  areaId: string,
  formData: FormData
) {
  const org = await requireOrgAccess(orgSlug)
  const existing = await prisma.diningArea.findFirst({
    where: { id: areaId, organizationId: org.id },
  })
  if (!existing) return { error: "Area not found" }

  const parsed = areaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  await prisma.diningArea.update({ where: { id: areaId }, data: parsed.data })

  revalidatePath(`/${orgSlug}/settings/tables`)
  return { success: true }
}

export async function deleteArea(orgSlug: string, areaId: string) {
  const org = await requireOrgAccess(orgSlug)
  await prisma.diningArea.delete({
    where: { id: areaId, organizationId: org.id },
  })
  revalidatePath(`/${orgSlug}/settings/tables`)
  return { success: true }
}

const tableSchema = z.object({
  name: z.string().min(1, "Name is required"),
  capacity: z.coerce.number().int().min(1),
  minCapacity: z.coerce.number().int().min(1).default(1),
  shape: z.enum(["RECTANGLE", "CIRCLE", "SQUARE", "OVAL"]).default("RECTANGLE"),
  diningAreaId: z.string().min(1, "Area is required"),
  posX: z.coerce.number().int().default(0),
  posY: z.coerce.number().int().default(0),
  notes: z.string().optional(),
  isCombinable: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
})

export async function createTable(orgSlug: string, formData: FormData) {
  const org = await requireOrgAccess(orgSlug)
  const parsed = tableSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const area = await prisma.diningArea.findFirst({
    where: { id: parsed.data.diningAreaId, organizationId: org.id },
  })
  if (!area) return { error: "Area not found" }

  await prisma.table.create({
    data: { organizationId: org.id, ...parsed.data },
  })

  revalidatePath(`/${orgSlug}/settings/tables`)
  return { success: true }
}

export async function updateTable(
  orgSlug: string,
  tableId: string,
  formData: FormData
) {
  const org = await requireOrgAccess(orgSlug)
  const existing = await prisma.table.findFirst({
    where: { id: tableId, organizationId: org.id },
  })
  if (!existing) return { error: "Table not found" }

  const parsed = tableSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  await prisma.table.update({ where: { id: tableId }, data: parsed.data })

  revalidatePath(`/${orgSlug}/settings/tables`)
  return { success: true }
}

export async function deleteTable(orgSlug: string, tableId: string) {
  const org = await requireOrgAccess(orgSlug)
  await prisma.table.delete({
    where: { id: tableId, organizationId: org.id },
  })
  revalidatePath(`/${orgSlug}/settings/tables`)
  return { success: true }
}
