"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { OrganizationSettings } from "@/generated/prisma"

interface WebBookingFormProps {
  orgSlug: string
  settings: OrganizationSettings | null
}

export function WebBookingForm({ orgSlug, settings }: WebBookingFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [refNumber, setRefNumber] = useState("")

  const [date, setDate] = useState("")
  const [partySize, setPartySize] = useState("2")
  const [selectedTime, setSelectedTime] = useState("")

  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Fetch available slots whenever date or partySize changes
  useEffect(() => {
    if (!date || !partySize) {
      setSlots([])
      setSelectedTime("")
      return
    }

    setLoadingSlots(true)
    setSelectedTime("")

    const params = new URLSearchParams({ orgSlug, date, partySize })
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? [])
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [date, partySize, orgSlug])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedTime) {
      toast.error("Please select a time slot")
      return
    }

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
          partySize: Number(partySize),
          date,
          time: selectedTime,
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
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-semibold">Booking Confirmed!</h2>
          <p className="text-muted-foreground text-sm">Your reservation reference is:</p>
          <p className="font-mono text-lg font-bold tracking-wide">{refNumber}</p>
          <p className="text-xs text-muted-foreground">
            A confirmation email has been sent if you provided your email address.
          </p>
        </CardContent>
      </Card>
    )
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const maxParty = settings?.maxPartySize ?? 20

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Make a Reservation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest details */}
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

          {/* Date + party size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                min={today}
                required
                className="mt-1"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="partySize">Guests *</Label>
              <Input
                id="partySize"
                name="partySize"
                type="number"
                min={1}
                max={maxParty}
                required
                className="mt-1"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
              />
            </div>
          </div>

          {/* Time slot picker */}
          <div>
            <Label>Time *</Label>
            {!date ? (
              <p className="text-sm text-muted-foreground mt-2">Select a date to see available times.</p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking availability…
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                No available slots for this date and party size. Please try another date.
              </p>
            ) : (
              <div className="mt-2">
                <Select value={selectedTime} onValueChange={setSelectedTime} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Special requests */}
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

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !selectedTime || loadingSlots}
          >
            {isPending ? "Booking…" : "Book Table"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
