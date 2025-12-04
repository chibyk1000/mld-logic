import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Button } from '@renderer/components/ui/button'
import { useForm, Controller } from 'react-hook-form'
import { useState } from 'react'
import { toast } from 'react-toastify'

interface ExpenseRecordFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ExpenseFormValues {
  type: string
  amount: number
  description?: string

}

export function ExpenseRecordForm({ open, onOpenChange, onSuccess }: ExpenseRecordFormProps) {
  const { control, handleSubmit, reset } = useForm<ExpenseFormValues>()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: ExpenseFormValues) => {
    setLoading(true)
    try {
      // Call IPC handler to create expense
      const result = await window.api.createExpense(data)
      if (result.success) {
        console.log('Expense created:', result.expense)
        reset()
        onOpenChange(false)
        toast.success("Expense created")
          onSuccess()
      } else {
        console.error('Failed to create expense:', result.error)
      }
    } catch (error) {
      console.error('Error submitting expense:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense Record</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Controller
              name="type"
              control={control}
              defaultValue=""
              rules={{ required: true }}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="type" className="font-medium">
                    Expense Type
                  </Label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="type" className='w-full'>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="salaries">Salaries</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            <Controller
              name="amount"
              control={control}
              defaultValue={0}
              rules={{ required: true, min: 0 }}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="amount" className="font-medium">
                    Amount
                  </Label>
                  <Input id="amount" type="number" placeholder="0.00" {...field} />
                </div>
              )}
            />

            <Controller
              name="description"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter expense details"
                    rows={3}
                    {...field}
                  />
                </div>
              )}
            />

            <Button className="w-full mt-4" type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Expense Record'}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
