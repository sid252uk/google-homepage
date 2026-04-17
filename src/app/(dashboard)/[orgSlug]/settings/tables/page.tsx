import { Header } from "@/components/layout/Header"
import { requireOrgAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AreaManager } from "@/components/settings/tables/AreaManager"

export default async function TablesSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const org = await requireOrgAccess(orgSlug)

  const areas = await prisma.diningArea.findMany({
    where: { organizationId: org.id },
    include: {
      tables: { orderBy: { name: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Tables & Areas" />
      <div className="flex-1 overflow-auto p-6">
        <AreaManager areas={areas} orgSlug={orgSlug} />
      </div>
    </div>
  )
}
