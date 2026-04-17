import { SubscriptionPlan } from "@/generated/prisma"
import type { Module } from "@/types"
import { prisma } from "@/lib/prisma"
import { cache } from "react"

export const PLAN_MODULES: Record<SubscriptionPlan, Module[]> = {
  BASIC: [
    "reservations:basic",
    "reservations:all_sources",
    "table_plan:view",
    "views:list",
    "widget:embeddable",
  ],
  PRO: [
    "reservations:basic",
    "reservations:all_sources",
    "table_plan:view",
    "table_plan:drag_drop",
    "views:list",
    "views:timeslot",
    "views:calendar",
    "reminders:email",
    "widget:embeddable",
  ],
  ENTERPRISE: [
    "reservations:basic",
    "reservations:all_sources",
    "table_plan:view",
    "table_plan:drag_drop",
    "views:list",
    "views:timeslot",
    "views:calendar",
    "reminders:email",
    "widget:embeddable",
    "analytics",
    "multi_location",
    "api:access",
  ],
}

export function hasModule(plan: SubscriptionPlan, module: Module): boolean {
  return PLAN_MODULES[plan].includes(module)
}

export const getSubscription = cache(async (organizationId: string) => {
  const sub = await prisma.subscription.findUnique({
    where: { organizationId },
  })
  return sub
})

export const getSubscriptionPlan = cache(
  async (organizationId: string): Promise<SubscriptionPlan> => {
    const sub = await getSubscription(organizationId)
    return sub?.plan ?? SubscriptionPlan.BASIC
  }
)

export async function requireModule(
  organizationId: string,
  module: Module
): Promise<void> {
  const plan = await getSubscriptionPlan(organizationId)
  if (!hasModule(plan, module)) {
    throw new Error(`MODULE_INSUFFICIENT:${module}`)
  }
}

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  BASIC: "Basic",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
}

export const PLAN_DESCRIPTIONS: Record<SubscriptionPlan, string> = {
  BASIC: "Essential reservation management for small restaurants",
  PRO: "Advanced features including the interactive table plan and multiple views",
  ENTERPRISE: "Full suite with multi-location, analytics, and API access",
}
