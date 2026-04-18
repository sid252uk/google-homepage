import { HeaderSkeleton } from "@/components/shared/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function TablePlanLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <HeaderSkeleton />
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Canvas area */}
        <div className="flex-1 rounded-xl border bg-card p-4 space-y-4">
          {/* Area tabs */}
          <div className="flex gap-2">
            {[80, 70, 90].map((w, i) => (
              <Skeleton key={i} className="h-8 rounded-md" style={{ width: w }} />
            ))}
          </div>
          {/* Table grid */}
          <div className="grid grid-cols-4 gap-4 pt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
        {/* Unassigned panel */}
        <div className="w-64 rounded-xl border bg-card p-4 space-y-3 shrink-0">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
