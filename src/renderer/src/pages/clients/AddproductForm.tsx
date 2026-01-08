import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { useState } from 'react'

interface AddProductFormProps {
  vendorId: string
  onClose: () => void
  onSubmit: (data: ProductFormData) => void
  defaultValues?: Partial<ProductFormData>
}


export interface ProductFormData {
  vendorId: string
  name: string
  description?: string
  price: number
  sku?: string
}

const schema = yup.object({
  name: yup.string().required('Product name is required'),
  description: yup.string().nullable(),
  price: yup
    .number()
    .typeError('Price must be a number')
    .required('Price is required')
    .positive('Price must be greater than 0'),
  sku: yup.string().nullable()
})

export function AddProductForm({
  vendorId,
  onClose,
  onSubmit,
  defaultValues
}: AddProductFormProps) {
  const isEditMode = Boolean(defaultValues?.name)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      vendorId,
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      price: defaultValues?.price ?? 0,
      sku: defaultValues?.sku ?? ''
    }
  })

  const submitForm = async (values: ProductFormData) => {
    onSubmit({
      ...values,
      vendorId
    })
  }

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-4">
      {/* Name */}
      <div className="space-y-1">
        <Label>Name</Label>
        <Input placeholder="Product Name" {...register('name')} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea placeholder="Optional description" rows={3} {...register('description')} />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      {/* Price */}
      <div className="space-y-1">
        <Label>Price</Label>
        <Input type="number" step="0.01" placeholder="0.00" {...register('price')} />
        {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
      </div>

      {/* SKU */}
      <div className="space-y-1">
        <Label>SKU</Label>
        <Input placeholder="Optional SKU code" {...register('sku')} />
        {errors.sku && <p className="text-red-500 text-sm">{errors.sku.message}</p>}
      </div>

      {/* Hidden Vendor ID */}
      <input type="hidden" {...register('vendorId')} />

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isEditMode ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  )
}

