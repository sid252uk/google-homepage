"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface CapacityWarningDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  partySize: number
  tableCapacity: number
  tableName: string
}

export function CapacityWarningDialog({
  open,
  onConfirm,
  onCancel,
  partySize,
  tableCapacity,
  tableName,
}: CapacityWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <DialogTitle>Table Over Capacity</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            This reservation is for <strong>{partySize} guests</strong>, but{" "}
            <strong>{tableName}</strong> only fits <strong>{tableCapacity} guests</strong>.
            Do you want to assign it anyway?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Assign Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
