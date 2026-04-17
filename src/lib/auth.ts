import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { cache } from "react"

export const requireOrgAccess = cache(async (orgSlug: string) => {
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    redirect("/sign-in")
  }

  const org = await prisma.organization.findFirst({
    where: {
      slug: orgSlug,
      clerkOrgId: orgId,
    },
    include: {
      subscription: true,
      settings: true,
    },
  })

  if (!org) notFound()

  return org
})

export const getCurrentOrg = cache(async () => {
  const { orgId } = await auth()
  if (!orgId) return null

  return prisma.organization.findFirst({
    where: { clerkOrgId: orgId },
    include: { subscription: true },
  })
})

export async function getOrgByClerkId(clerkOrgId: string) {
  return prisma.organization.findUnique({
    where: { clerkOrgId },
    include: { subscription: true },
  })
}
