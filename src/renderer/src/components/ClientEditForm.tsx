'use client'

import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'

export interface RegularClientFormValues {
  fullName: string
  phone: string
  address: string
  email: string
}

interface RegularClientEditFormProps {
  defaultValues: RegularClientFormValues
  onClose: () => void
  onSubmit: (data: RegularClientFormValues) => void
}

// Yup validation schema
const schema = Yup.object({
  fullName: Yup.string().required('Full name is required').min(2, 'Too short'),
  phone: Yup.string()
    .required('Phone is required')
    .matches(/^[\d+\-() ]+$/, 'Invalid phone number'),
  address: Yup.string().required('Address is required').min(5, 'Too short'),
  email: Yup.string().required('Email is required').email('Invalid email')
}).required()

export function RegularClientEditForm({
  defaultValues,
  onClose,
  onSubmit
}: RegularClientEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid }
  } = useForm<RegularClientFormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur'
  })

  const submitHandler = (data: RegularClientFormValues) => {
    onSubmit(data)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div className="space-y-1">
        <Label>Full Name</Label>
        <Input {...register('fullName')} />
        {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Phone</Label>
        <Input {...register('phone')} />
        {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Address</Label>
        <Textarea {...register('address')} rows={3} />
        {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Email</Label>
        <Input {...register('email')} />
        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
