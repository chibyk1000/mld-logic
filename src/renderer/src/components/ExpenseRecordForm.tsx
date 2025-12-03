import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'

interface ExpenseRecordFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpenseRecordForm({ open, onOpenChange }: ExpenseRecordFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense Record</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Expense Type</Label>
            <Select>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Enter expense details" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" />
          </div>

          <Button className="w-full">Add Expense Record</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
