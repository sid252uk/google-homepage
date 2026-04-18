"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReservationSource, ReservationStatus } from "@/generated/prisma"

const SOURCE_LABELS: Record<ReservationSource, string> = {
  TELEPHONE: "Phone",
  IN_PERSON: "In Person",
  WALKIN: "Walk-in",
  WEB_FORM: "Web",
  EMAIL: "Email",
  SOCIAL_MEDIA: "Social",
  THIRD_PARTY: "3rd Party",
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  INQUIRY: "Inquiry",
  CONFIRMED: "Confirmed",
  WAITLISTED: "Waitlisted",
  SEATED: "Seated",
  COMPLETED: "Completed",
  CANCELED: "Cancelled",
  NO_SHOW: "No Show",
}

const PIE_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#3b82f6", "#ec4899", "#14b8a6",
]

interface Props {
  dailyCounts: { date: string; count: number; covers: number }[]
  sourceCounts: { source: ReservationSource; count: number }[]
  statusCounts: { status: ReservationStatus; count: number }[]
  hourCounts: { hour: string; count: number }[]
}

export function AnalyticsCharts({ dailyCounts, sourceCounts, statusCounts, hourCounts }: Props) {
  const sourceData = sourceCounts.map((s) => ({
    name: SOURCE_LABELS[s.source],
    value: s.count,
  }))

  const statusData = statusCounts.map((s) => ({
    name: STATUS_LABELS[s.status],
    value: s.count,
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Daily reservations */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Reservations — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar dataKey="count" name="Reservations" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Covers per day */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Covers — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar dataKey="covers" name="Covers" fill="#22c55e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Source breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {sourceData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reservation Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Peak hours */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Peak Hours (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar dataKey="count" name="Reservations" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
