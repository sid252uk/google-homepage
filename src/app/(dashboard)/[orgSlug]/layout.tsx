import { requireOrgAccess } from "@/lib/auth"
import { Sidebar } from "@/components/layout/Sidebar"
import { SubscriptionPlan } from "@/generated/prisma"

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const org = await requireOrgAccess(orgSlug)
  const plan = org.subscription?.plan ?? SubscriptionPlan.BASIC

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={orgSlug} orgName={org.name} plan={plan} />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
