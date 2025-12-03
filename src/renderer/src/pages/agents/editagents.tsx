'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Button } from '@renderer/components/ui/button'
import { toast } from 'react-toastify'

type Warehouse = { id: string; name: string }

export type EditAgentValues = {
  name: string
  email: string
  phone: string
  warehouse: string
  status: 'active' | 'inactive'
}

const agentSchema = yup.object({
  name: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  warehouse: yup.string().required('Select a warehouse'),
  status: yup.string().oneOf(['active', 'inactive']).required('Status is required')
})

type EditAgentModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: any
  warehouses: Warehouse[]
  onSave: (data: EditAgentValues) => void
  onDelete: (id: string) => void
}

export default function EditAgentModal({
  open,
  onOpenChange,
  agent,
  warehouses,
  onSave,
  onDelete
}: EditAgentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<EditAgentValues>({
    resolver: yupResolver(agentSchema),
    defaultValues: {
      name: agent?.fullName || '',
      email: agent?.email || '',
      phone: agent?.phone || '',
      warehouse: agent?.warehouse.id || '',
      status: agent?.status || 'active'
    }
  })

  // Reset form whenever agent changes
  useEffect(() => {
    if (agent) {
      reset({
        name: agent.fullName,
        email: agent.email,
        phone: agent.phone,
        warehouse: agent.warehouse.id,
        status: agent.status
      })
    }
  }, [agent, reset])

  const submitHandler = (data: EditAgentValues) => {
    try {
      onSave(data)
      toast.success('Agent updated successfully')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update agent')
    }
  }

  if (!agent) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
        </DialogHeader>

        <form className="space-y-4 mt-4" onSubmit={handleSubmit(submitHandler)}>
          {/* Full Name */}
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input {...register('email')} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input {...register('phone')} />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
          </div>

          {/* Warehouse */}
          <div className="space-y-1">
            <Label>Assigned Warehouse</Label>
            <Controller
              control={control}
              name="warehouse"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full text-primary">
                    <SelectValue placeholder="Select Warehouse" />
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
            {errors.warehouse && <p className="text-red-500 text-sm">{errors.warehouse.message}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="destructive" type="button" onClick={() => onDelete(agent.id)}>
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
