import { Resend } from "resend"
import { format } from "date-fns"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? "TableFlow <noreply@resend.dev>"

export interface ReservationEmailData {
  orgName: string
  guestName: string
  guestEmail: string
  reservationNumber: string
  date: Date
  partySize: number
  durationMins: number
  specialRequests?: string | null
  occasion?: string | null
}

function baseTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:28px 40px;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">TableFlow</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              This email was sent by TableFlow on behalf of the restaurant. If you have questions, please contact the restaurant directly.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:8px 0;color:#64748b;font-size:14px;width:130px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${value}</td>
    </tr>`
}

export function buildConfirmationEmail(data: ReservationEmailData): string {
  const dateStr = format(data.date, "EEEE d MMMM yyyy")
  const timeStr = format(data.date, "HH:mm")
  const endTime = format(new Date(data.date.getTime() + data.durationMins * 60000), "HH:mm")

  const extras = [
    data.occasion ? detailRow("Occasion", data.occasion) : "",
    data.specialRequests ? detailRow("Requests", data.specialRequests) : "",
  ].join("")

  const body = `
    <h1 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">Booking Confirmed</h1>
    <p style="margin:0 0 32px;color:#64748b;font-size:15px;">Hi ${data.guestName}, your table at <strong>${data.orgName}</strong> is confirmed.</p>

    <div style="background:#f8fafc;border-radius:8px;padding:24px;margin-bottom:32px;">
      <table cellpadding="0" cellspacing="0" width="100%">
        ${detailRow("Reference", data.reservationNumber)}
        ${detailRow("Date", dateStr)}
        ${detailRow("Time", `${timeStr} – ${endTime}`)}
        ${detailRow("Guests", `${data.partySize} ${data.partySize === 1 ? "guest" : "guests"}`)}
        ${extras}
      </table>
    </div>

    <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
      Please quote your reference number <strong>${data.reservationNumber}</strong> if you need to make any changes.
      We look forward to seeing you!
    </p>`

  return baseTemplate(`Booking Confirmed — ${data.reservationNumber}`, body)
}

export function buildReminderEmail(data: ReservationEmailData): string {
  const dateStr = format(data.date, "EEEE d MMMM yyyy")
  const timeStr = format(data.date, "HH:mm")

  const body = `
    <h1 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">Your table is tomorrow</h1>
    <p style="margin:0 0 32px;color:#64748b;font-size:15px;">Hi ${data.guestName}, a reminder for your reservation at <strong>${data.orgName}</strong>.</p>

    <div style="background:#f8fafc;border-radius:8px;padding:24px;margin-bottom:32px;">
      <table cellpadding="0" cellspacing="0" width="100%">
        ${detailRow("Reference", data.reservationNumber)}
        ${detailRow("Date", dateStr)}
        ${detailRow("Time", timeStr)}
        ${detailRow("Guests", `${data.partySize} ${data.partySize === 1 ? "guest" : "guests"}`)}
      </table>
    </div>

    <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
      We look forward to welcoming you. If your plans change, please let us know as soon as possible.
    </p>`

  return baseTemplate(`Reminder: Your table at ${data.orgName} tomorrow`, body)
}

export async function sendConfirmationEmail(data: ReservationEmailData) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({
      from: FROM,
      to: data.guestEmail,
      subject: `Booking confirmed — ${data.reservationNumber} at ${data.orgName}`,
      html: buildConfirmationEmail(data),
    })
  } catch (err) {
    console.error("Failed to send confirmation email:", err)
  }
}

export async function sendReminderEmail(data: ReservationEmailData) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({
      from: FROM,
      to: data.guestEmail,
      subject: `Reminder: Your table at ${data.orgName} tomorrow`,
      html: buildReminderEmail(data),
    })
  } catch (err) {
    console.error("Failed to send reminder email:", err)
  }
}
