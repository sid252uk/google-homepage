"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createStripeCheckout, createBillingPortal } from "@/server/actions/billing"
import { SubscriptionPlan } from "@/generated/prisma"

interface BillingActionsProps {
  orgSlug: string
  orgId: string
  plan: SubscriptionPlan
  currentPlan: SubscriptionPlan
  stripeCustomerId: string | null
}

const planOrder: Record<SubscriptionPlan, number> = { BASIC: 0, PRO: 1, ENTERPRISE: 2 }

export function BillingActions({
  orgSlug,
  orgId,
  plan,
  currentPlan,
  stripeCustomerId,
}: BillingActionsProps) {
  const [isPending, startTransition] = useTransition()
  const isCurrent = plan === currentPlan
  const isDowngrade = planOrder[plan] < planOrder[currentPlan]

  if (isCurrent) {
    if (stripeCustomerId) {
      return (
        <Button
          variant="outline"
          className="w-full"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await createBillingPortal(orgSlug)
              if (result.error) toast.error(result.error)
              else if (result.url) window.location.href = result.url
            })
          }
        >
          {isPending ? "Loading..." : "Manage Billing"}
        </Button>
      )
    }
    return (
      <Button variant="outline" className="w-full" disabled>
        Current Plan
      </Button>
    )
  }

  return (
    <Button
      className="w-full"
      variant={isDowngrade ? "outline" : "default"}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await createStripeCheckout(orgSlug, orgId, plan)
          if (result.error) toast.error(result.error)
          else if (result.url) window.location.href = result.url
        })
      }
    >
      {isPending
        ? "Loading..."
        : isDowngrade
        ? "Downgrade"
        : "Upgrade"}
    </Button>
  )
}
