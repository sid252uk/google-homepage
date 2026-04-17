"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireOrgAccess } from "@/lib/auth"
import { z } from "zod"

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
