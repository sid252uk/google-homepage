import { Header } from "@/components/layout/Header"
import { requireOrgAccess } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WidgetSettingsClient } from "./WidgetSettingsClient"

export default async function WidgetSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  await requireOrgAccess(orgSlug)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const widgetUrl = `${appUrl}/book/${orgSlug}`

  const iframeSnippet = `<iframe
  src="${widgetUrl}"
  width="100%"
  height="700"
  frameborder="0"
  style="border:none; border-radius:12px;"
  title="Table Booking"
></iframe>`

  const linkSnippet = `<a href="${widgetUrl}" target="_blank" rel="noopener">
  Book a Table
</a>`

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Web Booking Widget" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Direct Link</CardTitle>
              <CardDescription>
                Share this URL directly with guests or add it to your Google Business, Instagram bio, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WidgetSettingsClient
                widgetUrl={widgetUrl}
                iframeSnippet={iframeSnippet}
                linkSnippet={linkSnippet}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
