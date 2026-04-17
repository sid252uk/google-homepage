"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createArea,
  updateArea,
  deleteArea,
  createTable,
  updateTable,
  deleteTable,
} from "@/server/actions/settings"
import type { DiningArea, Table } from "@/generated/prisma"

type AreaWithTables = DiningArea & { tables: Table[] }

interface AreaManagerProps {
  areas: AreaWithTables[]
  orgSlug: string
}

export function AreaManager({ areas: initialAreas, orgSlug }: AreaManagerProps) {
  const [, startTransition] = useTransition()
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(
    new Set(initialAreas.map((a) => a.id))
  )
  const [showNewAreaForm, setShowNewAreaForm] = useState(false)
  const [showNewTableForm, setShowNewTableForm] = useState<string | null>(null)
  const [editingArea, setEditingArea] = useState<string | null>(null)
  const [editingTable, setEditingTable] = useState<string | null>(null)

  function toggleArea(id: string) {
    setExpandedAreas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCreateArea(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createArea(orgSlug, fd)
      if ("error" in result) toast.error(result.error as string)
      else {
        toast.success("Area created")
        setShowNewAreaForm(false)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  async function handleDeleteArea(areaId: string) {
    if (!confirm("Delete this area? All tables in it will also be deleted.")) return
    startTransition(async () => {
      const result = await deleteArea(orgSlug, areaId)
      if ("error" in result) toast.error(result.error as string)
      else toast.success("Area deleted")
    })
  }

  async function handleCreateTable(areaId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("diningAreaId", areaId)
    startTransition(async () => {
      const result = await createTable(orgSlug, fd)
      if ("error" in result) toast.error(result.error as string)
      else {
        toast.success("Table created")
        setShowNewTableForm(null)
      }
    })
  }

  async function handleDeleteTable(tableId: string) {
    if (!confirm("Delete this table? Any assigned reservations will be unassigned.")) return
    startTransition(async () => {
      const result = await deleteTable(orgSlug, tableId)
      if ("error" in result) toast.error(result.error as string)
      else toast.success("Table deleted")
    })
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Areas */}
      {initialAreas.map((area) => (
        <Card key={area.id}>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleArea(area.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                {expandedAreas.has(area.id) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <CardTitle className="text-sm font-semibold">{area.name}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {area.tables.length} table{area.tables.length !== 1 ? "s" : ""}
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleDeleteArea(area.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </CardHeader>

          {expandedAreas.has(area.id) && (
            <CardContent className="px-4 pb-4">
              {/* Tables list */}
              <div className="space-y-2 mb-3">
                {area.tables.map((table) => (
                  <div
                    key={table.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2 bg-muted/20"
                  >
                    <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                      <span className="font-medium">{table.name}</span>
                      <span className="text-muted-foreground">
                        {table.capacity} covers (min {table.minCapacity})
                      </span>
                      <span className="text-muted-foreground capitalize">
                        {table.shape.toLowerCase()}
                      </span>
                      <span className="text-muted-foreground">
                        pos ({table.posX}, {table.posY})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteTable(table.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* New table form */}
              {showNewTableForm === area.id ? (
                <form onSubmit={(e) => handleCreateTable(area.id, e)} className="border rounded-md p-3 bg-muted/10">
                  <p className="text-xs font-semibold mb-3">Add Table</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <Label className="text-xs">Name *</Label>
                      <Input name="name" placeholder="T1" className="h-8 text-xs mt-1" required />
                    </div>
                    <div>
                      <Label className="text-xs">Capacity *</Label>
                      <Input name="capacity" type="number" min={1} defaultValue={4} className="h-8 text-xs mt-1" required />
                    </div>
                    <div>
                      <Label className="text-xs">Min Capacity</Label>
                      <Input name="minCapacity" type="number" min={1} defaultValue={1} className="h-8 text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Shape</Label>
                      <Select name="shape" defaultValue="RECTANGLE">
                        <SelectTrigger className="h-8 text-xs mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RECTANGLE">Rectangle</SelectItem>
                          <SelectItem value="CIRCLE">Circle</SelectItem>
                          <SelectItem value="SQUARE">Square</SelectItem>
                          <SelectItem value="OVAL">Oval</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Grid X</Label>
                      <Input name="posX" type="number" defaultValue={0} className="h-8 text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Grid Y</Label>
                      <Input name="posY" type="number" defaultValue={0} className="h-8 text-xs mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button type="submit" size="sm" className="h-7 text-xs">
                      <Check className="h-3 w-3 mr-1" /> Add Table
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowNewTableForm(null)}
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowNewTableForm(area.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Table
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {/* New area form */}
      {showNewAreaForm ? (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreateArea} className="space-y-3">
              <p className="text-sm font-semibold">New Dining Area</p>
              <div>
                <Label htmlFor="areaName">Name *</Label>
                <Input
                  id="areaName"
                  name="name"
                  placeholder="Main Floor"
                  className="mt-1"
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="areaDesc">Description</Label>
                <Input
                  id="areaDesc"
                  name="description"
                  placeholder="Optional description"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Create Area</Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewAreaForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowNewAreaForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Dining Area
        </Button>
      )}
    </div>
  )
}
