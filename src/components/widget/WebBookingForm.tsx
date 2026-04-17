"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrganizationSettings } from "@/generated/prisma"

interface WebBookingFormProps {
  orgSlug: string
  settings: OrganizationSettings | null
}

export function WebBookingForm({ orgSlug, settings }: WebBookingFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [refNumber, setRefNumber] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug,
          guestName: formData.get("guestName"),
          guestEmail: formData.get("guestEmail"),
          guestPhone: formData.get("guestPhone"),
          partySize: Number(formData.get("partySize")),
          date: formData.get("date"),
          time: formData.get("time"),
          specialRequests: formData.get("specialRequests"),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create reservation")
      } else {
        setRefNumber(data.reservationNumber)
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-semibold">Booking Confirmed!</h2>
          <p className="text-muted-foreground text-sm">
            Your reservation reference is:
          </p>
          <p className="font-mono text-lg font-bold">{refNumber}</p>
          <p className="text-xs text-muted-foreground">
            You will receive a confirmation email if you provided your email address.
          </p>
        </CardContent>
      </Card>
    )
  }

  const today = format(new Date(), "yyyy-MM-dd")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Make a Reservation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="guestName">Full Name *</Label>
            <Input id="guestName" name="guestName" required placeholder="Your name" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guestEmail">Email</Label>
              <Input id="guestEmail" name="guestEmail" type="email" placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="guestPhone">Phone</Label>
              <Input id="guestPhone" name="guestPhone" type="tel" placeholder="+44..." className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="partySize">Guests *</Label>
              <Input
                id="partySize"
                name="partySize"
                type="number"
                min={1}
                max={settings?.maxPartySize ?? 20}
                defaultValue={2}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                min={today}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                name="time"
                type="time"
                min={settings?.openingTime ?? "09:00"}
                max={settings?.closingTime ?? "23:00"}
                required
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              name="specialRequests"
              placeholder="Dietary requirements, celebrations, etc."
              className="mt-1"
              rows={3}
            />
          </div>
          {settings?.customTerms && (
            <p className="text-xs text-muted-foreground">{settings.customTerms}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Booking..." : "Book Table"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
