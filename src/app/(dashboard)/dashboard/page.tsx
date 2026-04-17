import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const { orgId } = await auth()
  if (!orgId) redirect("/sign-in")

  const org = await prisma.organization.findFirst({
    where: { clerkOrgId: orgId },
  })

  if (!org) {
    redirect("/onboarding")
  }

  redirect(`/${org.slug}/reservations`)
}
