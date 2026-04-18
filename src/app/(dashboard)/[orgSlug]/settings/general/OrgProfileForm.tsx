"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateOrgProfile } from "@/server/actions/settings"
import type { Organization, OrganizationSettings } from "@/generated/prisma"

const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Asia/Tokyo",
  "Asia/Singapore",
]

interface Props {
  orgSlug: string
  org: Organization & { settings: OrganizationSettings | null }
}

export function OrgProfileForm({ orgSlug, org }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateOrgProfile(orgSlug, fd)
      if ("error" in result) toast.error(result.error as string)
      else toast.success("Profile saved")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Restaurant Profile</CardTitle>
        <CardDescription>Basic information shown to guests.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Restaurant Name *</Label>
            <Input id="name" name="name" defaultValue={org.name} required className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Contact Email</Label>
              <Input id="email" name="email" type="email" defaultValue={org.email ?? ""} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={org.phone ?? ""} className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={org.address ?? ""} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select name="timezone" defaultValue={org.timezone ?? "UTC"}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue={org.currency ?? "GBP"}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP — £</SelectItem>
                  <SelectItem value="EUR">EUR — €</SelectItem>
                  <SelectItem value="USD">USD — $</SelectItem>
                  <SelectItem value="CAD">CAD — CA$</SelectItem>
                  <SelectItem value="AUD">AUD — A$</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
