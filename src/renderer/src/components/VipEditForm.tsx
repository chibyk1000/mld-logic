import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import { VendorUpdateInput } from 'generated/prisma/models'

interface VIPClientEditFormProps {
  onClose: () => void
  onSubmit: (data: VendorUpdateInput) => void
  defaultValues: Vendor
}

// Separate Yup schema for update
const schema = Yup.object({
  companyName: Yup.string().required('Company name is required'),
  contactName: Yup.string().required('Contact person is required'),
  phone: Yup.string()
    .required('Phone is required')
    .matches(/^[\d+\-() ]+$/, 'Phone format invalid'),
  email: Yup.string().required('Email is required').email('Invalid email'),
  address: Yup.string().required('Address is required')
}).required()

export function VIPClientEditForm({ onClose, onSubmit, defaultValues }: VIPClientEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<VendorUpdateInput>({
    resolver: yupResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })

  const submitHandler = (data: VendorUpdateInput) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4 text-sm">
      {/* COMPANY */}
      <div className="space-y-1">
        <Label>Company Name</Label>
        <Input {...register('companyName')} />
        {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
      </div>

      {/* CONTACT PERSON */}
      <div className="space-y-1">
        <Label>Contact Person</Label>
        <Input {...register('contactName')} />
        {errors.contactName && <p className="text-red-500 text-xs">{errors.contactName.message}</p>}
      </div>

      {/* PHONE + EMAIL */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input type="tel" {...register('phone')} />
          {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1">
          <Label>Email</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>
      </div>

      {/* ADDRESS */}
      <div className="space-y-1">
        <Label>Address</Label>
        <Textarea rows={3} {...register('address')} />
        {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
