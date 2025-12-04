'use client'

import { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'

interface OrderFormProps {
  onClose: () => void
  onSubmit: (data: any) => void
  clientType: 'vip' | 'regular'
  clients?: any[]
  warehouses?: any[]
  products?: any[]
}

function StepBadge({ number }: { number: number }) {
  return (
    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
      {number}
    </div>
  )
}

export function OrderForm({
  onClose,
  onSubmit,
  clientType,
  clients,
  warehouses,
  products
}: OrderFormProps) {
  const [formData, setFormData] = useState({
    client: '',
    warehouse: '',
    product: '',
    quantity: 0,
    destination: '',
    serviceCost: '',
    deliveryCost: '',
    pickupContactName: '',
    pickupContactPhone: '',
    pickupInstructions: '',
    deliveryContactName: '',
    deliveryContactPhone: '',
    deliveryAddress: '',
    deliveryInstructions: '',
    sensitivity: 'MEDIUM',
    collectPayment: false,
    additionalCost: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-background">
      <ScrollArea className="h-[70dvh] pr-4">
        <div className="space-y-8 pb-6">
          {/* STEP 1: ORDER BASICS */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <StepBadge number={1} />
              <h3 className="text-lg font-semibold text-foreground">Order Basics</h3>
            </div>
            <div className="space-y-4 pl-11 border-l-2 border-border">
              {/* Client */}
              <div className="space-y-2">
                <Label htmlFor="client" className="text-sm font-medium">
                  {clientType === 'vip' ? 'VIP Client' : 'Customer Name'}
                </Label>
             
                <Select onValueChange={(value) => setFormData({ ...formData, client: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((cl) => (
                      <SelectItem key={cl.id} value={cl.id}>
                        {clientType === 'vip' ? cl.companyName : cl.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {clientType === 'vip' && (
                <>
                  {/* Warehouse */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Source Warehouse</Label>
                    <Select
                      onValueChange={(value) => setFormData({ ...formData, warehouse: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses?.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Product</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, product: value })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quantity</Label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: +e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* STEP 2: PICKUP INFORMATION */}
          {clientType === 'vip' && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <StepBadge number={2} />
                <h3 className="text-lg font-semibold text-foreground">Pickup Information</h3>
              </div>
              <div className="space-y-4 pl-11 border-l-2 border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input
                      placeholder="Full name"
                      value={formData.pickupContactName}
                      onChange={(e) =>
                        setFormData({ ...formData, pickupContactName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      placeholder="Phone number"
                      value={formData.pickupContactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, pickupContactPhone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    placeholder="Special instructions for pickup..."
                    rows={3}
                    value={formData.pickupInstructions}
                    onChange={(e) =>
                      setFormData({ ...formData, pickupInstructions: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: DELIVERY INFORMATION */}
          {
            clientType === "vip" &&
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <StepBadge number={clientType === 'vip' ? 3 : 2} />
              <h3 className="text-lg font-semibold text-foreground">Delivery Information</h3>
            </div>
            <div className="space-y-4 pl-11 border-l-2 border-border">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    placeholder="Full name"
                    value={formData.deliveryContactName}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryContactName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    placeholder="Phone number"
                    value={formData.deliveryContactPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryContactPhone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Delivery Address</Label>
                <Input
                  placeholder="Street, city, zip code"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Special Instructions</Label>
                <Textarea
                  placeholder="Delivery notes..."
                  rows={3}
                  value={formData.deliveryInstructions}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryInstructions: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Sensitivity Level</Label>
                <Select
                  value={formData.sensitivity}
                  onValueChange={(value) => setFormData({ ...formData, sensitivity: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
          }

          {/* STEP 4: COSTS & PAYMENT */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <StepBadge number={clientType === 'vip' ? 4 : 2} />
              <h3 className="text-lg font-semibold text-foreground">Costs & Payment</h3>
            </div>
            <div className="space-y-4 pl-11 border-l-2 border-border">
              {clientType === 'regular' && (
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input
                    placeholder="Destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Service Cost</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.serviceCost}
                  onChange={(e) => setFormData({ ...formData, serviceCost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Cost</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.deliveryCost}
                  onChange={(e) => setFormData({ ...formData, deliveryCost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Additional Cost</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.additionalCost}
                  onChange={(e) => setFormData({ ...formData, additionalCost: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-3 cursor-pointer">
                <Checkbox
                  checked={formData.collectPayment}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, collectPayment: !!checked })
                  }
                />
                <Label className="cursor-pointer font-medium">Collect Payment on Delivery</Label>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="border-t border-border bg-card p-4 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          Create Order
        </Button>
      </div>
    </form>
  )
}
