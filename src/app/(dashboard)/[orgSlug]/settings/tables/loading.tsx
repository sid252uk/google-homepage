import { HeaderSkeleton } from "@/components/shared/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function TablesLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <HeaderSkeleton />
      <div className="flex-1 overflow-auto p-6 space-y-4 max-w-3xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16 ml-1" />
            </div>
            <div className="p-4 space-y-2">
              {Array.from({ length: i + 2 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full rounded-md" />
              ))}
              <Skeleton className="h-7 w-28 rounded-md mt-3" />
            </div>
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}
