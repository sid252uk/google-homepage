import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { Webhook } from "svix"
import { prisma } from "@/lib/prisma"
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch {
    return new Response("Invalid webhook signature", { status: 400 })
  }

  const { type, data } = evt

  if (type === "organization.created") {
    const { id: clerkOrgId, name, slug } = data

    await prisma.organization.upsert({
      where: { clerkOrgId },
      update: { name, slug: slug ?? clerkOrgId },
      create: {
        clerkOrgId,
        name,
        slug: slug ?? clerkOrgId,
        subscription: {
          create: {
            plan: SubscriptionPlan.BASIC,
            status: SubscriptionStatus.TRIALING,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        },
        settings: {
          create: {},
        },
      },
    })
  }

  if (type === "organization.updated") {
    const { id: clerkOrgId, name, slug } = data

    await prisma.organization.update({
      where: { clerkOrgId },
      data: { name, slug: slug ?? clerkOrgId },
    })
  }

  if (type === "organizationMembership.created") {
    const { organization, public_user_data, role } = data
    const roleMap: Record<string, "OWNER" | "MANAGER" | "STAFF"> = {
      "org:admin": "OWNER",
      "org:manager": "MANAGER",
      "org:member": "STAFF",
    }

    const org = await prisma.organization.findUnique({
      where: { clerkOrgId: organization.id },
    })
    if (org) {
      await prisma.organizationMember.upsert({
        where: {
          organizationId_clerkUserId: {
            organizationId: org.id,
            clerkUserId: public_user_data.user_id,
          },
        },
        update: { role: roleMap[role] ?? "STAFF" },
        create: {
          organizationId: org.id,
          clerkUserId: public_user_data.user_id,
          role: roleMap[role] ?? "STAFF",
        },
      })
    }
  }

  return new Response("OK", { status: 200 })
}
