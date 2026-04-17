"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDays,
  LayoutGrid,
  Settings,
  BarChart3,
  Users,
  CreditCard,
  ChevronDown,
  UtensilsCrossed,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { SubscriptionPlan } from "@/generated/prisma"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  requiredPlan?: SubscriptionPlan
}

interface SidebarProps {
  orgSlug: string
  orgName: string
  plan: SubscriptionPlan
}

export function Sidebar({ orgSlug, orgName, plan }: SidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      label: "Reservations",
      href: `/${orgSlug}/reservations`,
      icon: CalendarDays,
    },
    {
      label: "Table Plan",
      href: `/${orgSlug}/table-plan`,
      icon: LayoutGrid,
      requiredPlan: "PRO",
    },
    {
      label: "Analytics",
      href: `/${orgSlug}/analytics`,
      icon: BarChart3,
      requiredPlan: "ENTERPRISE",
    },
  ]

  const settingsItems: NavItem[] = [
    {
      label: "Tables & Areas",
      href: `/${orgSlug}/settings/tables`,
      icon: UtensilsCrossed,
    },
    {
      label: "Team",
      href: `/${orgSlug}/settings/team`,
      icon: Users,
    },
    {
      label: "Billing",
      href: `/${orgSlug}/settings/billing`,
      icon: CreditCard,
    },
    {
      label: "General",
      href: `/${orgSlug}/settings`,
      icon: Settings,
    },
  ]

  const planOrder: Record<SubscriptionPlan, number> = { BASIC: 0, PRO: 1, ENTERPRISE: 2 }

  function isLocked(item: NavItem) {
    if (!item.requiredPlan) return false
    return planOrder[plan] < planOrder[item.requiredPlan]
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">TableFlow</span>
      </div>

      {/* Org name */}
      <div className="border-b px-4 py-3">
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
            {orgName.charAt(0).toUpperCase()}
          </div>
          <span className="flex-1 truncate text-left font-medium">{orgName}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const locked = isLocked(item)
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={locked ? `/${orgSlug}/settings/billing` : item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active && !locked
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  locked && "opacity-60"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {locked && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {item.requiredPlan}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>

        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Settings
          </p>
          <div className="space-y-1">
            {settingsItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Plan badge */}
      <div className="border-t px-4 py-3">
        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
          <span className="text-xs text-muted-foreground">Current plan</span>
          <Badge variant={plan === "ENTERPRISE" ? "default" : plan === "PRO" ? "info" : "secondary"} className="text-xs">
            {plan}
          </Badge>
        </div>
      </div>
    </aside>
  )
}
