import { Header } from "@/components/layout/Header"
import { requireOrgAccess } from "@/lib/auth"
import { getSubscriptionPlan, PLAN_LABELS, PLAN_DESCRIPTIONS, PLAN_MODULES } from "@/lib/subscription"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Zap } from "lucide-react"
import { SubscriptionPlan } from "@/generated/prisma"
import { BillingActions } from "@/components/settings/billing/BillingActions"

const PLAN_PRICES: Record<SubscriptionPlan, { monthly: string; annual: string }> = {
  BASIC: { monthly: "£29", annual: "£290" },
  PRO: { monthly: "£79", annual: "£790" },
  ENTERPRISE: { monthly: "£199", annual: "£1,990" },
}

const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  BASIC: [
    "Unlimited reservations",
    "All reservation sources",
    "Web booking widget",
    "Table plan (read-only view)",
    "List view",
    "Basic settings",
  ],
  PRO: [
    "Everything in Basic",
    "Table plan with drag-and-drop",
    "Time-slot view",
    "Calendar view",
    "Automated email reminders",
    "Team management",
  ],
  ENTERPRISE: [
    "Everything in Pro",
    "Multi-location support",
    "Analytics dashboard",
    "API access",
    "Priority support",
    "Custom integrations",
  ],
}

export default async function BillingPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const org = await requireOrgAccess(orgSlug)
  const currentPlan = await getSubscriptionPlan(org.id)

  const plans = [SubscriptionPlan.BASIC, SubscriptionPlan.PRO, SubscriptionPlan.ENTERPRISE]

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Billing & Subscription" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl">
          <p className="text-sm text-muted-foreground mb-6">
            Current plan:{" "}
            <strong>{PLAN_LABELS[currentPlan]}</strong>
            {org.subscription?.currentPeriodEnd && (
              <span>
                {" · "}Renews{" "}
                {new Date(org.subscription.currentPeriodEnd).toLocaleDateString("en-GB")}
              </span>
            )}
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan === currentPlan
              const isPro = plan === SubscriptionPlan.PRO

              return (
                <Card
                  key={plan}
                  className={isPro ? "border-primary shadow-md" : undefined}
                >
                  {isPro && (
                    <div className="rounded-t-lg bg-primary px-4 py-1.5 text-center">
                      <span className="text-xs font-semibold text-primary-foreground flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3" /> Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{PLAN_LABELS[plan]}</CardTitle>
                      {isCurrent && <Badge variant="success">Current</Badge>}
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{PLAN_PRICES[plan].monthly}</span>
                      <span className="text-muted-foreground text-sm">/mo</span>
                    </div>
                    <CardDescription>{PLAN_DESCRIPTIONS[plan]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {PLAN_FEATURES[plan].map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <BillingActions
                      orgSlug={orgSlug}
                      orgId={org.id}
                      plan={plan}
                      currentPlan={currentPlan}
                      stripeCustomerId={org.subscription?.stripeCustomerId ?? null}
                    />
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
