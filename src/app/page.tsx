import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, LayoutGrid, Users, Zap, Globe, BarChart3 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b">
        <div className="mx-auto max-w-6xl px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">P</span>
            </div>
            <span className="font-bold text-lg">Prenota</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get started free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-6">
          Restaurant Management SAAS
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Manage your tables,{" "}
          <span className="text-primary">effortlessly</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Prenota gives your restaurant a powerful reservation management system with
          an interactive table plan, multi-source bookings, and real-time updates — all
          in one place.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/sign-up">Start free trial</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Sign in to your account</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: CalendarDays,
              title: "Multi-source Reservations",
              desc: "Take bookings by phone, in person, online, or via social media. Every source tracked and logged.",
            },
            {
              icon: LayoutGrid,
              title: "Interactive Table Plan",
              desc: "Drag-and-drop reservations to tables visually. Automatic capacity warnings keep you organised.",
            },
            {
              icon: Globe,
              title: "Web Booking Widget",
              desc: "Embed a beautiful booking form on your website. Available on all plans.",
            },
            {
              icon: Zap,
              title: "Multiple Views",
              desc: "Switch between list, time-slot, and calendar views to see your day exactly how you want.",
            },
            {
              icon: Users,
              title: "Multi-business Ready",
              desc: "Run multiple restaurants from one account. Each business is fully isolated.",
            },
            {
              icon: BarChart3,
              title: "Subscription Tiers",
              desc: "Start free, upgrade as you grow. Basic, Pro, and Enterprise plans available.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Start managing tables today</h2>
          <p className="text-muted-foreground mb-8">
            14-day free trial. No credit card required.
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-up">Create your account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Prenota</span>
          <span>Restaurant Table Management</span>
        </div>
      </footer>
    </div>
  )
}
