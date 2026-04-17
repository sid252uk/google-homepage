"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createReservation, updateReservation } from "@/server/actions/reservations"
import { ReservationSource } from "@/generated/prisma"
import type { Reservation } from "@/generated/prisma"

const SOURCES: { value: ReservationSource; label: string }[] = [
  { value: "TELEPHONE", label: "Telephone" },
  { value: "IN_PERSON", label: "In Person" },
  { value: "WALKIN", label: "Walk-in" },
  { value: "WEB_FORM", label: "Web Form" },
  { value: "EMAIL", label: "Email" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "THIRD_PARTY", label: "Third Party" },
]

interface ReservationFormProps {
  orgSlug: string
  reservation?: Reservation
}

export function ReservationForm({ orgSlug, reservation }: ReservationFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isEdit = !!reservation

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = isEdit
        ? await updateReservation(orgSlug, reservation.id, formData)
        : await createReservation(orgSlug, formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? "Reservation updated" : "Reservation created")
      router.push(`/${orgSlug}/reservations`)
    })
  }

  const defaultDate = reservation
    ? format(new Date(reservation.date), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd")

  const defaultTime = reservation
    ? format(new Date(reservation.date), "HH:mm")
    : "19:00"

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Guest details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guest Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="guestName">Full Name *</Label>
              <Input
                id="guestName"
                name="guestName"
                defaultValue={reservation?.guestName}
                placeholder="Jane Smith"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                name="guestEmail"
                type="email"
                defaultValue={reservation?.guestEmail ?? ""}
                placeholder="jane@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="guestPhone">Phone</Label>
              <Input
                id="guestPhone"
                name="guestPhone"
                type="tel"
                defaultValue={reservation?.guestPhone ?? ""}
                placeholder="+44 7700 000000"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reservation details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={defaultDate}
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
                  defaultValue={defaultTime}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="partySize">Party Size *</Label>
                <Input
                  id="partySize"
                  name="partySize"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={reservation?.partySize ?? 2}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="durationMins">Duration (mins)</Label>
                <Input
                  id="durationMins"
                  name="durationMins"
                  type="number"
                  min={30}
                  step={15}
                  defaultValue={reservation?.durationMins ?? 90}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="source">Source *</Label>
              <Select name="source" defaultValue={reservation?.source ?? "TELEPHONE"}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="occasion">Occasion</Label>
              <Input
                id="occasion"
                name="occasion"
                defaultValue={reservation?.occasion ?? ""}
                placeholder="Birthday, Anniversary..."
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={reservation?.notes ?? ""}
                placeholder="Staff notes..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                name="specialRequests"
                defaultValue={reservation?.specialRequests ?? ""}
                placeholder="Guest requests..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="dietaryNotes">Dietary Notes</Label>
              <Textarea
                id="dietaryNotes"
                name="dietaryNotes"
                defaultValue={reservation?.dietaryNotes ?? ""}
                placeholder="Allergies, dietary requirements..."
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEdit ? "Update Reservation" : "Create Reservation"}
        </Button>
      </div>
    </form>
  )
}
