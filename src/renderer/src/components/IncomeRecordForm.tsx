import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'

interface IncomeRecordFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void

}

export function IncomeRecordForm({ open, onOpenChange }: IncomeRecordFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Income Record</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orderId" className="font-medium">
                Order ID
              </Label>
              <Input id="orderId" placeholder="ORD-001" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client" className="font-medium">
                Client Name
              </Label>
              <Input id="client" placeholder="Client Name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="font-medium">
                Category
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vip">VIP Client</SelectItem>
                  <SelectItem value="regular">Regular Client</SelectItem>
                  <SelectItem value="pickup-drop">Pick & Drop</SelectItem>
                  <SelectItem value="errands">Errands</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="font-medium">
                Amount
              </Label>
              <Input id="amount" type="number" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentReceived" className="font-medium">
                Payment Received (VIP)
              </Label>
              <Input id="paymentReceived" type="number" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceCost" className="font-medium">
                Service Cost
              </Label>
              <Input id="serviceCost" type="number" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remittanceDue" className="font-medium">
                Remittance Due (VIP)
              </Label>
              <Input id="remittanceDue" type="number" placeholder="Auto-calculated" disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="font-medium">
                Date
              </Label>
              <Input id="date" type="date" />
            </div>
          </div>
        </ScrollArea>
        <Button className="w-full">Add Income Record</Button>
      </DialogContent>
    </Dialog>
  )
}
