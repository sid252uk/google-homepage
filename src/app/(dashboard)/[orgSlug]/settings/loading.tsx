import { HeaderSkeleton, CardGridSkeleton } from "@/components/shared/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <HeaderSkeleton />
      <div className="flex-1 overflow-auto p-6 space-y-4 max-w-2xl">
        <Skeleton className="h-20 w-full rounded-xl" />
        <CardGridSkeleton cards={4} />
      </div>
    </div>
  )
}
