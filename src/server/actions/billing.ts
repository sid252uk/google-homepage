"use server"

import { requireOrgAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe, STRIPE_PRICE_IDS, createCheckoutSession, createBillingPortalSession } from "@/lib/stripe"
import { SubscriptionPlan } from "@/generated/prisma"

export async function createStripeCheckout(
  orgSlug: string,
  orgId: string,
  plan: SubscriptionPlan
) {
  const org = await requireOrgAccess(orgSlug)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const priceId = STRIPE_PRICE_IDS[plan as keyof typeof STRIPE_PRICE_IDS]
  if (!priceId || priceId === "price_placeholder") {
    return { error: "Stripe is not configured yet. Please add price IDs to your environment variables." }
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: org.id },
    })

    const session = await createCheckoutSession({
      stripeCustomerId: subscription?.stripeCustomerId ?? undefined,
      priceId,
      organizationId: org.id,
      successUrl: `${appUrl}/${orgSlug}/settings/billing?success=true`,
      cancelUrl: `${appUrl}/${orgSlug}/settings/billing`,
    })

    return { url: session.url }
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return { error: "Failed to create checkout session" }
  }
}

export async function createBillingPortal(orgSlug: string) {
  const org = await requireOrgAccess(orgSlug)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: org.id },
  })

  if (!subscription?.stripeCustomerId) {
    return { error: "No billing account found" }
  }

  try {
    const session = await createBillingPortalSession(
      subscription.stripeCustomerId,
      `${appUrl}/${orgSlug}/settings/billing`
    )
    return { url: session.url }
  } catch (err) {
    console.error("Stripe portal error:", err)
    return { error: "Failed to open billing portal" }
  }
}
