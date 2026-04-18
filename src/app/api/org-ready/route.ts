import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ ready: false }, { status: 401 })

  const org = await prisma.organization.findFirst({
    where: { clerkOrgId: orgId },
    select: { slug: true },
  })

  if (!org) return Response.json({ ready: false }, { status: 202 })

  return Response.json({ ready: true, slug: org.slug })
}
