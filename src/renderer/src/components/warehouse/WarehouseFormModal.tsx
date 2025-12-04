'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { useState } from 'react'

export function WarehouseFormModal({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [form, setForm] = useState({
    name: '',
    location: '',
    capacity: ''
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Warehouse</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              placeholder="Example: Central Warehouse"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>Location</Label>
            <Input
              placeholder="Example: Los Angeles, CA"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>Capacity</Label>
            <Input
              placeholder="Example: 50,000 sq ft"
              value={form.capacity}
              type='number'


              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>Add Warehouse</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
