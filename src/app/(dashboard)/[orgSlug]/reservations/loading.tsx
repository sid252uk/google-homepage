import { HeaderSkeleton, TableRowsSkeleton } from "@/components/shared/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReservationsLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <HeaderSkeleton />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Tab bar */}
        <div className="flex gap-2">
          {[80, 90, 80].map((w, i) => (
            <Skeleton key={i} className="h-9 rounded-md" style={{ width: w }} />
          ))}
        </div>
        {/* Filters */}
        <div className="flex gap-3">
          <Skeleton className="h-9 w-64 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
        <TableRowsSkeleton rows={10} />
      </div>
    </div>
  )
}
