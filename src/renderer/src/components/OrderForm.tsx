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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './ui/command'
import { cn } from '@renderer/lib/utils'

interface OrderFormProps {
  onClose: () => void
  onSubmit: (formData: {
    client: string
    warehouse: string
    products: string[]
    quantity: number

    serviceCharge: string
    pickupContactName: string
    pickupContactPhone: string
    pickupInstructions: string
    deliveryContactName: string
    deliveryContactPhone: string
    deliveryAddress: string
    deliveryInstructions: string
    collectPayment: boolean
    additionalCharge: string
    pickupAddress: string
    amountReceived: string
  }) => void
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
    products: [] as string[],
    quantity: 0,
 
    serviceCharge: '',

    pickupContactName: '',
    pickupContactPhone: '',
    pickupInstructions: '',
    deliveryContactName: '',
    deliveryContactPhone: '',
    deliveryAddress: '',
    deliveryInstructions: '',
 
    collectPayment: false,
    additionalCharge: '',
    pickupAddress: '',
    amountReceived:""
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
              <h3 className="text-lg font-semibold text-foreground">Customer</h3>
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
                    <label className="text-sm font-medium">Products</label>

                    <Popover >
                      <PopoverTrigger asChild className=''>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {formData.products.length > 0
                            ? `${formData.products.length} selected`
                            : 'Select products'}

                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-sm p-0  ">
                        <Command>
                          <CommandEmpty>No product found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {products?.map((p) => {
                                const id = String(p.id)

                                return (
                                  <CommandItem key={id} onSelect={() => {
                                        if (formData.products.includes(id)) {
                                          setFormData((prev) => ({
                                            ...prev,
                                            products: formData.products.filter((p) => p !== id)
                                          }))
                                        } else {
                                          setFormData((prev) => ({
                                            ...prev,
                                            products: [...formData.products, id]
                                          }))
                                        }
                                  }}>
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        formData.products.includes(id) ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />

                                    {p.name}
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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

              {/* Manual Pickup Address */}
              <div className="space-y-2">
                <Label>Pickup Address</Label>
                <Input
                  placeholder="Pickup Address"
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <StepBadge number={3} />
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
            </div>
          </section>

          {/* STEP 4: COSTS & PAYMENT */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <StepBadge number={4} />
              <h3 className="text-lg font-semibold text-foreground">Charge & Payment</h3>
            </div>
            <div className="space-y-4 pl-11 border-l-2 border-border">
              <div className="space-y-2">
                <Label>Amount Received </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amountReceived}
                  min={0}
                  onChange={(e) => setFormData({ ...formData, amountReceived: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Service Charge</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0.00"
                  value={formData.serviceCharge}
                  onChange={(e) => setFormData({ ...formData, serviceCharge: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Charge</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  min={0}
                  value={formData.additionalCharge}
                  onChange={(e) => setFormData({ ...formData, additionalCharge: e.target.value })}
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
