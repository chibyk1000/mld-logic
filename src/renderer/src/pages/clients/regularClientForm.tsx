'use client'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@renderer/components/ui/form'

export type RegularClientFormValues = {
  fullName: string
  phone: string
  email?: string
  address: string
}
    // @ts-ignore
const schema: yup.Schema<RegularClientFormValues> = yup.object({
  fullName: yup.string().required('Client name is required'),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^\+?[0-9]+$/, 'Invalid phone number'),
  email: yup.string().email('Invalid email').optional(),
  address: yup.string().required('Address is required')
})

export function RegularClientForm({
  onSubmit,
  onClose
}: {
  onSubmit: (data: RegularClientFormValues) => void
  onClose: () => void
}) {
  const form = useForm<RegularClientFormValues>({
    // @ts-ignore
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: '',
      phone: '',
      
      email: '',
      address: ''
    }
  })

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          onSubmit(values)
          onClose()
        })}
      >
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optional)</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main Street" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Client</Button>
        </div>
      </form>
    </Form>
  )
}
