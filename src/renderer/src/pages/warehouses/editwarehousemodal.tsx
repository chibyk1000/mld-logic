'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { Button } from '@renderer/components/ui/button'
import { toast } from 'react-toastify'

type Warehouse = {
  id: string
  name: string
  location: string
  capacity: string
  description?: string
  status?: string
}

const warehouseSchema = yup.object({
  name: yup.string().required('Warehouse name is required'),
  location: yup.string().required('Location is required'),
  capacity: yup.string().required('Capacity is required'),
  description: yup.string().required('Description is required')
})

export type EditWarehouseValues = yup.InferType<typeof warehouseSchema>

type EditWarehouseModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouse: Warehouse | null
  onSave: (data: EditWarehouseValues) => void
  onDelete: (id: string) => void
}

export default function EditWarehouseModal({
  open,
  onOpenChange,
  warehouse,
  onSave,
  onDelete
}: EditWarehouseModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EditWarehouseValues>({
    resolver: yupResolver(warehouseSchema),
    defaultValues: warehouse || {
      name: '',
      location: '',
      capacity: '',
      description: ''
    }
  })

  // Reset form whenever warehouse changes
  useEffect(() => {
    if (warehouse) {
      reset({
        name: warehouse.name,
        location: warehouse.location,
        capacity: warehouse.capacity,
        description: warehouse.description || ''
      })
    }
  }, [warehouse, reset])

  const submitHandler = (data: EditWarehouseValues) => {
    try {
      onSave(data)
      toast.success('Warehouse updated successfully')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update warehouse')
    }
  }

  if (!warehouse) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Warehouse</DialogTitle>
        </DialogHeader>

        <form className="space-y-4 mt-4" onSubmit={handleSubmit(submitHandler)}>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input {...register('name')} defaultValue={warehouse.name} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Location</Label>
            <Input {...register('location')} defaultValue={warehouse.location} />
            {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Capacity</Label>
            <Input {...register('capacity')} defaultValue={warehouse.capacity} />
            {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              {...register('description')}
              rows={5}
              defaultValue={warehouse.description || ''}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="destructive" type="button" onClick={() => onDelete(warehouse.id)}>
              Delete
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
