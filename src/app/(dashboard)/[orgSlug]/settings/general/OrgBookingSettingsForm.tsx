"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateOrgSettings } from "@/server/actions/settings"
import type { OrganizationSettings } from "@/generated/prisma"

interface Props {
  orgSlug: string
  settings: OrganizationSettings | null
}

export function OrgBookingSettingsForm({ orgSlug, settings }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateOrgSettings(orgSlug, fd)
      if ("error" in result) toast.error(result.error as string)
      else toast.success("Settings saved")
    })
  }

  const s = settings

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Booking Settings</CardTitle>
        <CardDescription>Controls how reservations are created and the booking widget behaves.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Hours */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Opening Hours</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openingTime">Opening Time</Label>
                <Input id="openingTime" name="openingTime" type="time" defaultValue={s?.openingTime ?? "09:00"} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="closingTime">Closing Time</Label>
                <Input id="closingTime" name="closingTime" type="time" defaultValue={s?.closingTime ?? "23:00"} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Slots */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Slot Configuration</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="slotIntervalMins">Slot Interval (mins)</Label>
                <Input id="slotIntervalMins" name="slotIntervalMins" type="number" min={5} max={120} step={5} defaultValue={s?.slotIntervalMins ?? 15} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="defaultResDurationMins">Default Duration (mins)</Label>
                <Input id="defaultResDurationMins" name="defaultResDurationMins" type="number" min={15} max={480} step={15} defaultValue={s?.defaultResDurationMins ?? 90} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="maxPartySize">Max Party Size</Label>
                <Input id="maxPartySize" name="maxPartySize" type="number" min={1} max={200} defaultValue={s?.maxPartySize ?? 20} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Emails */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Email Notifications</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="confirmationEmailEnabled"
                  defaultChecked={s?.confirmationEmailEnabled ?? true}
                  className="h-4 w-4 rounded border border-input accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">Confirmation emails</p>
                  <p className="text-xs text-muted-foreground">Send guests a confirmation when a reservation is created</p>
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="reminderEmailEnabled"
                  defaultChecked={s?.reminderEmailEnabled ?? true}
                  className="h-4 w-4 rounded border border-input accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">Reminder emails <span className="text-xs text-muted-foreground">(Pro+)</span></p>
                  <p className="text-xs text-muted-foreground">Send guests a reminder the day before their booking</p>
                </div>
              </label>
              <div className="pt-1">
                <Label htmlFor="reminderHoursBefore">Send reminder (hours before)</Label>
                <Input id="reminderHoursBefore" name="reminderHoursBefore" type="number" min={1} max={72} defaultValue={s?.reminderHoursBefore ?? 24} className="mt-1 w-32" />
              </div>
            </div>
          </div>

          {/* Widget */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Booking Widget</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="widgetPrimaryColor">Brand Colour</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    id="widgetPrimaryColor"
                    name="widgetPrimaryColor"
                    defaultValue={s?.widgetPrimaryColor ?? "#000000"}
                    className="h-8 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
                  />
                  <Input
                    defaultValue={s?.widgetPrimaryColor ?? "#000000"}
                    className="w-32 font-mono text-sm"
                    readOnly
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customTerms">Custom Terms / Footer Text</Label>
                <Textarea
                  id="customTerms"
                  name="customTerms"
                  defaultValue={s?.customTerms ?? ""}
                  placeholder="e.g. By booking you agree to our cancellation policy..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
