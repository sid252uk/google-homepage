"use client"

import { useState, useEffect } from "react"
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
  Home,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { SubscriptionPlan } from "@/generated/prisma"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredPlan?: SubscriptionPlan
}

interface SidebarProps {
  orgSlug: string
  orgName: string
  plan: SubscriptionPlan
}

export function Sidebar({ orgSlug, orgName, plan }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Persist collapsed state
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored === "true") setCollapsed(true)
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev))
      return !prev
    })
  }

  const navItems: NavItem[] = [
    { label: "Dashboard",     href: `/${orgSlug}/dashboard`,   icon: Home },
    { label: "Reservations",  href: `/${orgSlug}/reservations`, icon: CalendarDays },
    { label: "Table Plan",    href: `/${orgSlug}/table-plan`,   icon: LayoutGrid, requiredPlan: "PRO" },
    { label: "Analytics",     href: `/${orgSlug}/analytics`,    icon: BarChart3,  requiredPlan: "ENTERPRISE" },
  ]

  const settingsItems: NavItem[] = [
    { label: "Tables & Areas", href: `/${orgSlug}/settings/tables`,   icon: UtensilsCrossed },
    { label: "Team",            href: `/${orgSlug}/settings/team`,     icon: Users },
    { label: "Billing",         href: `/${orgSlug}/settings/billing`,  icon: CreditCard },
    { label: "General",         href: `/${orgSlug}/settings/general`,  icon: Settings },
  ]

  const planOrder: Record<SubscriptionPlan, number> = { BASIC: 0, PRO: 1, ENTERPRISE: 2 }

  function isLocked(item: NavItem) {
    if (!item.requiredPlan) return false
    return planOrder[plan] < planOrder[item.requiredPlan]
  }

  const w = collapsed ? "w-16" : "w-64"

  function NavLink({ item, activeCheck }: { item: NavItem; activeCheck: (href: string) => boolean }) {
    const locked = isLocked(item)
    const active = activeCheck(item.href)
    const href = locked ? `/${orgSlug}/settings/billing` : item.href

    return (
      <Link
        href={href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
          collapsed ? "justify-center gap-0" : "gap-3",
          active && !locked
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
          locked && "opacity-60"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {locked && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {item.requiredPlan}
              </Badge>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-200 shrink-0",
        w
      )}
    >
      {/* Logo + toggle */}
      <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center px-3" : "justify-between px-4")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">TableFlow</span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Org name */}
      {!collapsed ? (
        <div className="border-b px-4 py-3">
          <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary shrink-0">
              {orgName.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-left font-medium">{orgName}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div className="border-b flex justify-center py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary" title={orgName}>
            {orgName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} activeCheck={(href) => pathname.startsWith(href)} />
        ))}

        {!collapsed && (
          <p className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Settings
          </p>
        )}
        {collapsed && <div className="my-4 border-t mx-2" />}

        {settingsItems.map((item) => (
          <NavLink key={item.href} item={item} activeCheck={(href) => pathname === href} />
        ))}
      </nav>

      {/* Plan badge + expand button */}
      <div className="border-t px-2 py-3">
        {collapsed ? (
          <button
            onClick={toggle}
            className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
            <span className="text-xs text-muted-foreground">Current plan</span>
            <Badge
              variant={plan === "ENTERPRISE" ? "default" : plan === "PRO" ? "info" : "secondary"}
              className="text-xs"
            >
              {plan}
            </Badge>
          </div>
        )}
      </div>
    </aside>
  )
}
