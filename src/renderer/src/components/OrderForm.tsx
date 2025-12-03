import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { useState } from 'react'
import { Vendor } from '@renderer/pages/clients/vip'
import { Clients } from '@renderer/pages/clients/regular'

interface OrderFormProps {
  onClose: () => void
  onSubmit: (data: any) => void
  clientType: 'vip' | 'regular',
  clients?: Vendor[]  | Clients[]
  warehouses?:any[]
  products?:any[]
}

export function OrderForm({ onClose, onSubmit, clientType, clients,warehouses, products }: OrderFormProps) {
  const [formData, setFormData] = useState({
    client: '',
    quantity:0,
    warehouse: '',
    destination: '',
    collectPayment: false,
    paymentReceived: '',
    productCost: '',
    serviceCost: '',
    product:"",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    // onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client">{clientType === 'vip' ? 'VIP Client' : 'Customer Name'}</Label>
        {clientType === 'vip' ? (
          <Select onValueChange={(value) => setFormData({ ...formData, client: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((cl) => {
                return <SelectItem value={cl.id}>{cl.companyName}</SelectItem>
              })}
            </SelectContent>
          </Select>
        ) : (
          <Select onValueChange={(value) => setFormData({ ...formData, client: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((cl) => {
                return <SelectItem value={cl.id}>{cl.fullName}</SelectItem>
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      {clientType === 'vip' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="warehouse">Source Warehouse</Label>

            <Select onValueChange={(value) => setFormData({ ...formData, warehouse: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses?.map((cl) => {
                  return <SelectItem value={cl.id}>{cl.name}</SelectItem>
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouse">Product</Label>

            <Select onValueChange={(value) => setFormData({ ...formData, product: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((cl) => {
                  return <SelectItem value={cl.id}>{cl.name}</SelectItem>
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouse">Quantity</Label>

            <Input
              id="quantity"
              type="number"
              step="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value as any })}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="destination">Destination</Label>
        <Input
          id="destination"
          value={formData.destination}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="collectPayment"
          checked={formData.collectPayment}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, collectPayment: checked as boolean })
          }
        />
        <Label htmlFor="collectPayment" className="cursor-pointer">
          Collect Payment on Delivery
        </Label>
      </div>

      {formData.collectPayment && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentReceived">Payment Amount</Label>
              <Input
                id="paymentReceived"
                type="number"
                step="0.01"
                value={formData.paymentReceived}
                onChange={(e) => setFormData({ ...formData, paymentReceived: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCost">Product Cost</Label>
              <Input
                id="productCost"
                type="number"
                step="0.01"
                value={formData.productCost}
                onChange={(e) => setFormData({ ...formData, productCost: e.target.value })}
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="serviceCost">Service Cost</Label>
        <Input
          id="serviceCost"
          type="number"
          step="0.01"
          value={formData.serviceCost}
          onChange={(e) => setFormData({ ...formData, serviceCost: e.target.value })}
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Order</Button>
      </div>
    </form>
  )
}
