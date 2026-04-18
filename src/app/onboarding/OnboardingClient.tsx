"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CreateOrganization, useOrganization } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface OnboardingClientProps {
  hasClerkOrg: boolean
}

export function OnboardingClient({ hasClerkOrg }: OnboardingClientProps) {
  const router = useRouter()
  const { organization } = useOrganization()
  const [checking, setChecking] = useState(false)
  const [attempts, setAttempts] = useState(0)

  // Once a Clerk org exists, poll until the webhook has created the DB record
  useEffect(() => {
    if (!organization) return
    setChecking(true)

    const interval = setInterval(async () => {
      setAttempts((n) => n + 1)
      try {
        const res = await fetch("/api/org-ready")
        if (res.ok) {
          const data = await res.json()
          if (data.slug) {
            clearInterval(interval)
            router.push(`/${data.slug}/reservations`)
          }
        }
      } catch {
        // ignore, keep polling
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [organization, router])

  if (hasClerkOrg && !organization) {
    // Org exists in Clerk but webhook hasn't fired yet — show spinner
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="font-semibold text-lg">Setting up your restaurant…</p>
          <p className="text-sm text-muted-foreground">
            This takes just a moment. You&apos;ll be redirected automatically.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="font-semibold text-lg">Finishing setup…</p>
          <p className="text-sm text-muted-foreground">
            {attempts > 5
              ? "Taking a little longer than usual — almost there."
              : "Setting up your workspace…"}
          </p>
        </div>
      </div>
    )
  }

  // No Clerk org at all — prompt to create one
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <span className="text-primary-foreground text-xl font-bold">T</span>
        </div>
        <h1 className="text-3xl font-bold">Welcome to TableFlow</h1>
        <p className="text-muted-foreground mt-2">
          Create your restaurant to get started.
        </p>
      </div>
      <CreateOrganization
        afterCreateOrganizationUrl="/onboarding"
        skipInvitationScreen
      />
    </div>
  )
}
