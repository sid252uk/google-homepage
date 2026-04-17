import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma"
import type Stripe from "stripe"

function mapStripePlan(priceId: string): SubscriptionPlan {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return SubscriptionPlan.PRO
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return SubscriptionPlan.ENTERPRISE
  return SubscriptionPlan.BASIC
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    trialing: SubscriptionStatus.TRIALING,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    unpaid: SubscriptionStatus.UNPAID,
    incomplete: SubscriptionStatus.PAST_DUE,
    incomplete_expired: SubscriptionStatus.CANCELED,
    paused: SubscriptionStatus.PAST_DUE,
  }
  return map[status] ?? SubscriptionStatus.CANCELED
}

function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const raw = sub as unknown as Record<string, unknown>
  if (typeof raw.current_period_end === "number") {
    return new Date(raw.current_period_end * 1000)
  }
  if (typeof sub.cancel_at === "number") {
    return new Date(sub.cancel_at * 1000)
  }
  return null
}

export async function POST(req: Request) {
  const body = await req.text()
  const headerPayload = await headers()
  const sig = headerPayload.get("stripe-signature")

  if (!sig) return new Response("Missing stripe-signature", { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response("Invalid webhook signature", { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const organizationId = session.metadata?.organizationId
    if (!organizationId || !session.subscription) return new Response("OK")

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = subscription.items.data[0]?.price.id ?? ""

    await prisma.subscription.update({
      where: { organizationId },
      data: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        plan: mapStripePlan(priceId),
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.billing_cycle_anchor * 1000),
        currentPeriodEnd: getPeriodEnd(subscription),
      },
    })
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription
    const organizationId = subscription.metadata?.organizationId
    if (!organizationId) return new Response("OK")

    const priceId = subscription.items.data[0]?.price.id ?? ""

    await prisma.subscription.update({
      where: { organizationId },
      data: {
        stripePriceId: priceId,
        plan: mapStripePlan(priceId),
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.billing_cycle_anchor * 1000),
        currentPeriodEnd: getPeriodEnd(subscription),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    const organizationId = subscription.metadata?.organizationId
    if (!organizationId) return new Response("OK")

    await prisma.subscription.update({
      where: { organizationId },
      data: {
        plan: SubscriptionPlan.BASIC,
        status: SubscriptionStatus.CANCELED,
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
    })
  }

  return new Response("OK", { status: 200 })
}
