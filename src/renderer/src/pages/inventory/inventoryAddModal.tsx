'use client'

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent
} from '@renderer/components/ui/select'
import { Plus } from 'lucide-react'

import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useState } from 'react'
import { Vendor } from '../clients/vip'
import { toast } from 'react-toastify'



export interface AddInventoryForm {
  vendorId: string
  productId: string
  warehouseId: string
  quantity: number
}

const schema = yup.object({
  vendorId: yup.string().required('Vendor is required'),
  productId: yup.string().required('Product is required'),
  warehouseId: yup.string().required('Warehouse is required'),
  quantity: yup.number().min(1, 'Must be at least 1').required('Quantity required')
})

export function InventoryAddModal({
  vendors,
    onSuccess,
    products,
    warehouses
  
}: {
  vendors: Vendor[]
  onSuccess?: () => void
        products: any[]
  warehouses:any[]
}) {
  const [open, setOpen] = useState(false)

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<AddInventoryForm>({
    resolver: yupResolver(schema),
    defaultValues: { vendorId: '', productId: '', warehouseId: '', quantity: 1 }
  })

  const selectedVendor = vendors.find((v) => v.id === watch('vendorId'))

  async function onSubmit(values: AddInventoryForm) {
    try {
        const res = await window.api.createInventory(values)
        console.log(res);
        
      if (res.success) {
          onSuccess?.()
          toast.success("Invenntory added")
        reset()
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 w-4 h-4" />
          Add Stock
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inventory</DialogTitle>
          <DialogDescription>Register stock for a product in a warehouse</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-3">
          {/* VENDOR */}
          <div className="space-y-1">
            <Label>Vendor</Label>
            <Controller
              name="vendorId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.vendorId && (
              <p className="text-destructive text-sm">{errors.vendorId.message}</p>
            )}
          </div>

          {/* PRODUCT */}
          <div className="space-y-1">
            <Label>Product</Label>
            <Controller
              name="productId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedVendor}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedVendor?.products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.productId && (
              <p className="text-destructive text-sm">{errors.productId.message}</p>
            )}
          </div>

          {/* WAREHOUSE */}
          <div className="space-y-1">
            <Label>Warehouse</Label>
            <Controller
              name="warehouseId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedVendor}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.warehouseId && (
              <p className="text-destructive text-sm">{errors.warehouseId.message}</p>
            )}
          </div>

          {/* QUANTITY */}
          <div className="space-y-1">
            <Label>Quantity</Label>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => <Input type="number" min={1} {...field} />}
            />
            {errors.quantity && (
              <p className="text-destructive text-sm">{errors.quantity.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
