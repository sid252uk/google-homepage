import { Header } from "@/components/layout/Header"
import { requireOrgAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TeamPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const org = await requireOrgAccess(orgSlug)

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Team" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <div className="space-y-3">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium font-mono text-muted-foreground">
                        {m.clerkUserId}
                      </span>
                      <Badge variant={m.role === "OWNER" ? "default" : m.role === "MANAGER" ? "info" : "secondary"}>
                        {m.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Invite team members via{" "}
                <a
                  href="https://dashboard.clerk.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Clerk Dashboard
                </a>{" "}
                or use the Clerk organisation invite flow.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
