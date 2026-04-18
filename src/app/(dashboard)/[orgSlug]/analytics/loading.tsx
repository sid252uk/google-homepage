import { HeaderSkeleton, StatCardsSkeleton, ChartSkeleton } from "@/components/shared/PageSkeleton"

export default function AnalyticsLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <HeaderSkeleton />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <StatCardsSkeleton count={4} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <ChartSkeleton height={240} />
          </div>
          <div className="lg:col-span-2">
            <ChartSkeleton height={220} />
          </div>
          <ChartSkeleton height={220} />
          <ChartSkeleton height={220} />
          <div className="lg:col-span-2">
            <ChartSkeleton height={200} />
          </div>
        </div>
      </div>
    </div>
  )
}
