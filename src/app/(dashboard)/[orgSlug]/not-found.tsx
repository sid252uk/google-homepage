import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function OrgNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This reservation, page, or resource doesn&apos;t exist or has been deleted.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="reservations">Back to reservations</Link>
          </Button>
          <Button variant="outline" onClick={() => history.back()} asChild>
            <button type="button">Go back</button>
          </Button>
        </div>
      </div>
    </div>
  )
}
