import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { orgId, userId } = await auth()
  if (!orgId || !userId) return Response.json({ ready: false }, { status: 401 })

  let org = await prisma.organization.findFirst({
    where: { clerkOrgId: orgId },
    select: { slug: true },
  })

  // Webhook hasn't fired yet (e.g. local dev) — create the org record now
  if (!org) {
    try {
      const client = await clerkClient()
      const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId })
      const baseSlug = clerkOrg.slug ?? clerkOrg.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

      // Ensure slug is unique
      let slug = baseSlug
      let suffix = 1
      while (await prisma.organization.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix++}`
      }

      org = await prisma.organization.create({
        data: {
          clerkOrgId: orgId,
          name: clerkOrg.name,
          slug,
          subscription: {
            create: {
              plan: "BASIC",
              status: "TRIALING",
            },
          },
        },
        select: { slug: true },
      })
    } catch {
      return Response.json({ ready: false }, { status: 202 })
    }
  }

  return Response.json({ ready: true, slug: org.slug })
}
