import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import { VendorCreateInput } from 'generated/prisma/models'

interface VIPClientFormProps {
  onClose: () => void
  onSubmit: (data: VendorCreateInput) => void
}


// Yup validation schema
const schema = Yup.object({
  companyName: Yup.string()
    .required('Company name is required')
    .min(2, 'Company name must be at least 2 characters'),
  contactName: Yup.string()
    .required('Contact person is required')
    .min(2, 'Contact name must be at least 2 characters'),
  phone: Yup.string()
    .required('Phone is required')
    .matches(/^[\d+\-() ]+$/, 'Phone number format is invalid'),
  email: Yup.string().required('Email is required').email('Invalid email format'),
  address: Yup.string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters')
}).required()

export function VIPClientForm({ onClose, onSubmit }: VIPClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid }
  } = useForm<VendorCreateInput>({
    resolver: yupResolver(schema),
    mode: 'onBlur'
  })

  const submitHandler = (data: VendorCreateInput) => {
    onSubmit(data)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4 text-sm">
      {/* COMPANY */}
      <div className="space-y-1">
        <Label>Company Name</Label>
        <Input {...register('companyName')} />
        {errors.company && <p className="text-red-500 text-xs">{errors.company.message}</p>}
      </div>

      {/* CONTACT PERSON */}
      <div className="space-y-1">
        <Label>Contact Person</Label>
        <Input {...register('contactName')} />
        {errors.contact && <p className="text-red-500 text-xs">{errors.contact.message}</p>}
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

        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Add Client'}
        </Button>
      </div>
    </form>
  )
}
