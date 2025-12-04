'use client'

import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'

interface EditOrderModalProps {
  order: any
  isOpen: boolean
  onClose: () => void
  onSave: (updates: Partial<any>) => void
}
export const MOCK_AGENTS = ['John Agent', 'Sarah Agent', 'Mike Agent', 'Lisa Agent', 'Unassigned']

export function EditOrderModal({ order, isOpen, onClose, onSave }: EditOrderModalProps) {
  const [formData, setFormData] = useState({
    clientName: order.clientName,
    pickupLocation: order.pickupLocation,
    deliveryLocation: order.deliveryLocation,
    status: order.status,
    agentAssigned: order.agentAssigned || 'Unassigned',
    totalCost: order.totalCost
  })

  const handleSave = () => {
    onSave({
      ...formData,
      agentAssigned: formData.agentAssigned === 'Unassigned' ? undefined : formData.agentAssigned
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Order {order.orderNumber}</DialogTitle>
          <DialogDescription>Update order details and assignment</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="client">Client Name</Label>
            <Input
              id="client"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Enter client name"
            />
          </div>

          {/* Pickup Location */}
          <div className="space-y-2">
            <Label htmlFor="pickup">Pickup Location</Label>
            <Input
              id="pickup"
              value={formData.pickupLocation}
              onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
              placeholder="Enter pickup location"
            />
          </div>

          {/* Delivery Location */}
          <div className="space-y-2">
            <Label htmlFor="delivery">Delivery Location</Label>
            <Input
              id="delivery"
              value={formData.deliveryLocation}
              onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
              placeholder="Enter delivery location"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(status) => setFormData({ ...formData, status: status as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agent Assignment */}
          <div className="space-y-2">
            <Label htmlFor="agent">Assign Agent</Label>
            <Select
              value={formData.agentAssigned}
              onValueChange={(agent) => setFormData({ ...formData, agentAssigned: agent })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOCK_AGENTS.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost">Total Cost</Label>
            <Input
              id="cost"
              type="number"
              value={formData.totalCost}
              onChange={(e) =>
                setFormData({ ...formData, totalCost: Number.parseFloat(e.target.value) })
              }
              placeholder="Enter total cost"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
