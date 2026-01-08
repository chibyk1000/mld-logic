import { MetricCard } from '@renderer/components/MetricCard'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { CheckCircle, Clock, DollarSign, } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import dayjs from 'dayjs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Input } from '@renderer/components/ui/input'

export default function Remittance() {
  const [remittances, setRemittance] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [selectedRemittance, setSelectedRemittance] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PAID' | 'PENDING'>('all')
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5 // Number of rows per page

  const [newRemittance, setNewRemittance] = useState({
    clientId: '',
    periodStart: dayjs().format('YYYY-MM-DD'),
    periodEnd: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    selectedOrders: [] as any[]
  })

  const loadRemittance = async () => {
    try {
      const list = await window.api.listRemittances()

      const summary = await window.api.getRemittanceMetrics()
      setSummary(summary)

      setRemittance(list.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load remittances.')
    }
  }

  const loadClientsAndOrders = async () => {
    try {
      const clientList = await window.api.listClients()
      const orderList = await window.api.listDeliveryOrders()
      setClients(clientList.data)
      setOrders(orderList.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadRemittance()
    loadClientsAndOrders()
  }, [])

  const markAsPaid = async () => {
    if (!selectedRemittance) return
    try {
      await window.api.addRemittancePayment({
        remittanceId: selectedRemittance.id,
        amount: parseFloat(selectedRemittance.totalCost),
        method: 'CASH',
        reference: 'Manual',
        notes: 'Marked as paid via dashboard'
      })
      toast.success('Remittance marked as paid')
      setOpenModal(false)
      setSelectedRemittance(null)
      loadRemittance()
    } catch (err) {
      console.error(err)
      toast.error('Failed to mark remittance as paid')
    }
  }
useEffect(() => {
  setCurrentPage(1)
}, [searchQuery])

  const createRemittance = async () => {
    if (!newRemittance.clientId || newRemittance.selectedOrders.length === 0) {
      toast.error('Please select a client and at least one order')
      return
    }
    try {
      await window.api.createRemittance({
        clientId: newRemittance.clientId,
        periodStart: newRemittance.periodStart,
        periodEnd: newRemittance.periodEnd,
        orders: newRemittance.selectedOrders
      })
      toast.success('Remittance created successfully')
      setOpenCreateModal(false)
      setNewRemittance({
        clientId: '',
        periodStart: dayjs().format('YYYY-MM-DD'),
        periodEnd: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        selectedOrders: []
      })
      loadRemittance()
    } catch (err) {
      console.error(err)
      toast.error('Failed to create remittance')
    }
  }
  const filteredRemittances = remittances.filter((r) => {
    const query = searchQuery.toLowerCase()

    const name = (r.clientName || r.vendorName || '').toLowerCase()

    const matchesSearch = name.includes(query)

    const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter

    const matchesBalance = balanceFilter === 'all' ? true : Number(r.amountLeft) > 0

    return matchesSearch && matchesStatus && matchesBalance
  })
const paginatedRemittaance = filteredRemittances.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Remittance Ledger</h2>
          <p className="text-muted-foreground mt-1">Track vendor payments and remittances</p>
        </div>
        {/* <Button
          onClick={() => {
            setOpenCreateModal(true)
            loadClientsAndOrders()
          }}
          icon={Plus}
        >
          New Remittance
        </Button> */}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Pending"
          value={summary?.totalPending}
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="Completed This Month"
          value={summary?.completedThisMonth}
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Service Fees Earned"
          value={summary?.serviceFees}
          icon={DollarSign}
          variant="destructive"
        />
      </div>

      {/* Remittance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Remittances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <Input
              placeholder="Search client or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:max-w-sm"
            />

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>

            {/* Balance Filter */}
            <Select value={balanceFilter} onValueChange={(v) => setBalanceFilter(v as any)}>
              <SelectTrigger className="md:w-[220px]">
                <SelectValue placeholder="Balance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Remittances</SelectItem>
                <SelectItem value="due">Outstanding Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client / Vendor</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Payment Received</TableHead>
                <TableHead className="text-right">Service Cost</TableHead>
                {/* <TableHead className="text-right">Total Cost</TableHead> */}
                <TableHead className="text-right">Remittance Due</TableHead>

                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRemittaance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No remittances found
                  </TableCell>
                </TableRow>
              )}

              {paginatedRemittaance.map((remittance) => {
                return (
                  <TableRow key={remittance.id}>
                    <TableCell className="font-medium">
                      {remittance.clientName || remittance.vendorName}
                    </TableCell>
                    <TableCell className="text-center">{remittance.orderCount}</TableCell>
                    <TableCell className="text-right">
                      ₦{Number(remittance.totalReceived).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ₦{Number(remittance.totalCharged).toLocaleString()}
                    </TableCell>
                    {/* <TableCell className="text-right">₦{remittance.totalCost}</TableCell> */}
                    <TableCell className="text-right font-semibold">
                      ₦{Number(remittance.amountLeft).toLocaleString()}
                    </TableCell>

                    <TableCell>
                      {/* @ts-ignore */}
                      <Badge variant={remittance.status === 'PAID' ? 'success' : 'secondary'}>
                        {remittance.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {remittance.status.toLowerCase() === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRemittance(remittance)
                            setOpenModal(true)
                          }}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-2">
            <Button
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </Button>

            <span>
              Page {currentPage} of {Math.ceil(filteredRemittances.length / pageSize)}
            </span>

            <Button
              size="sm"
              disabled={currentPage === Math.ceil(filteredRemittances.length / pageSize)}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mark Paid Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Remittance as Paid</DialogTitle>
          </DialogHeader>
          <p className="my-4">
            Are you sure you want to mark the remittance for{' '}
            <strong>{selectedRemittance?.clientName || selectedRemittance?.vendorName}</strong> as
            paid? This will record a payment of {selectedRemittance?.remittanceDue}.
          </p>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button onClick={markAsPaid}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Remittance Modal */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Remittance</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col space-y-4">
            {/* Select Client */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Select Client</label>
              <Select
                value={newRemittance.clientId}
                onValueChange={(val) => setNewRemittance({ ...newRemittance, clientId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Select Client --" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Start / End */}
            <div className="flex gap-2">
              <div className="flex flex-col space-y-1 w-full">
                <label className="text-sm font-medium">Period Start</label>
                <Input
                  type="date"
                  value={newRemittance.periodStart}
                  onChange={(e) =>
                    setNewRemittance({ ...newRemittance, periodStart: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col space-y-1 w-full">
                <label className="text-sm font-medium">Period End</label>
                <Input
                  type="date"
                  value={newRemittance.periodEnd}
                  onChange={(e) =>
                    setNewRemittance({ ...newRemittance, periodEnd: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Select Orders */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Select Orders</label>

              {/* ShadCN does NOT have <Select multiple> so use native or custom */}
              <select
                multiple
                className="w-full border rounded-md p-2 h-32 bg-background"
                value={newRemittance.selectedOrders.map((o) => o.orderId)}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions).map((o) => {
                    const order = orders.find((ord) => ord.id === o.value)
                    return { orderId: order.id, expectedAmount: order.cost }
                  })
                  setNewRemittance({
                    ...newRemittance,
                    selectedOrders: selectedOptions
                  })
                }}
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} - ${o.cost}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setOpenCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={createRemittance}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
