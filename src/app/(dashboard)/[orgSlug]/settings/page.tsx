import { Header } from "@/components/layout/Header"
import { requireOrgAccess } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UtensilsCrossed, Users, CreditCard, Globe } from "lucide-react"
import { getSubscriptionPlan, PLAN_LABELS } from "@/lib/subscription"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const org = await requireOrgAccess(orgSlug)
  const plan = await getSubscriptionPlan(org.id)

  const sections = [
    {
      icon: UtensilsCrossed,
      title: "Tables & Areas",
      description: "Configure dining areas, tables, capacities and positions",
      href: `/${orgSlug}/settings/tables`,
    },
    {
      icon: Users,
      title: "Team",
      description: "Invite and manage staff members and their roles",
      href: `/${orgSlug}/settings/team`,
    },
    {
      icon: CreditCard,
      title: "Billing",
      description: "Manage your subscription plan and payment details",
      href: `/${orgSlug}/settings/billing`,
    },
    {
      icon: Globe,
      title: "Web Booking Widget",
      description: "Get the embed code for your restaurant's website",
      href: `/${orgSlug}/settings/widget`,
    },
  ]

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Settings" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{org.name}</CardTitle>
                <Badge variant="info">{PLAN_LABELS[plan]}</Badge>
              </div>
              <CardDescription>{org.email ?? org.address ?? "No contact info set"}</CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((section) => (
              <Link key={section.href} href={section.href}>
                <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-sm">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
