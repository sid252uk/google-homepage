import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OnboardingClient } from "./OnboardingClient"

export default async function OnboardingPage() {
  const { userId, orgId } = await auth()

  if (!userId) redirect("/sign-in")

  // If they already have an org in DB, send them to the dashboard
  if (orgId) {
    const org = await prisma.organization.findFirst({
      where: { clerkOrgId: orgId },
    })
    if (org) redirect(`/${org.slug}/reservations`)
  }

  return <OnboardingClient hasClerkOrg={!!orgId} />
}
