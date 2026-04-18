import { Header } from "@/components/layout/Header"
import { requireOrgAccess } from "@/lib/auth"
import { OrgProfileForm } from "./OrgProfileForm"
import { OrgBookingSettingsForm } from "./OrgBookingSettingsForm"

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const org = await requireOrgAccess(orgSlug)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="General Settings" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-8">
          <OrgProfileForm orgSlug={orgSlug} org={org} />
          <OrgBookingSettingsForm orgSlug={orgSlug} settings={org.settings} />
        </div>
      </div>
    </div>
  )
}
