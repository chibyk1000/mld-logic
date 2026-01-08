import { useEffect, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { Badge } from '@renderer/components/ui/badge'
import { Plus, Package, DollarSign, TrendingUp, Pencil, Trash2,  Eye } from 'lucide-react'

import { VIPClientForm } from '@renderer/components/VipClientForm'
import { VIPClientEditForm } from '@renderer/components/VipEditForm'
import { OrderForm } from '@renderer/components/OrderForm'
import { MetricCard } from '@renderer/components/MetricCard'
import { ClientPerformanceAnalytics } from '@renderer/components/ClientPerformanceAnalytics'
import { VendorGetPayload } from 'generated/prisma/models'

import { toast } from 'react-toastify'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Input } from '@renderer/components/ui/input'

import { useNavigate } from 'react-router-dom'


export type Vendor = VendorGetPayload<{
  include: { deliveryOrders: true; products: true; inventory: true; warehouses: true }
}>

export default function VIPClients() {
  const [clients, setClients] = useState<Vendor[]>([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'with-stock' | 'no-stock'>('all')
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'with-orders'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10 // Number of rows per page

  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const navigate = useNavigate()

  const [selectedClient, setSelectedClient] = useState<Vendor | null>(null)
  const [stats, setStats] = useState<{
    weekly: {
      period: string
      requested: number
      delivered: number
      failed: number
    }[]
    monthly: {
      period: string
      requested: number
      delivered: number
      failed: number
    }[]
  }>({ monthly: [], weekly: [] })

  const loadStats = async () => {
    try {
      const list = await window.api.getVendorStats()
      console.log(list)
      setStats(list.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load products')
    }
  }

  /**
   * Load Vendors
   */
  const loadClients = async () => {
    try {
      const list = await window.api.listVendors()
      setClients(list.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load clients.')
    }
  }
  const loadWarehouses = async () => {
    try {
      const list = await window.api.listWarehouses()
      setWarehouses(list.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load warehouse.')
    }
  }
  const loadProducts = async () => {
    try {
      const list = await window.api.listProducts()
      setProducts(list.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load products')
    }
  }

  useEffect(() => {
    loadClients()
    loadStats()
    loadWarehouses()
    loadProducts()
  }, [])

  /**
   * Add Client
   */
  const handleAddClient = async (data: any) => {
    try {
      await window.api.createVendor(data)
      toast.success('Client added ✔️')
      setIsClientDialogOpen(false)
      await loadClients()
    } catch {
      toast.error('Error adding client')
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, stockFilter, ordersFilter])

  /**
   * Edit Client
   */
  const handleEditClient = async (data: any) => {
    if (!selectedClient) return
    try {
      const { products, warehouses, inventory, ...rest } = data
      await window.api.updateVendor(selectedClient.id, rest)
      toast.success('Client updated ✔️')
      setIsEditDialogOpen(false)
      setSelectedClient(null)
      await loadClients()
    } catch {
      toast.error('Update failed.')
    }
  }

  /**
   * Delete client
   */
  const handleDeleteClient = async (id: string) => {
    try {
      console.log(id)
      await window.api.deleteVendor(id)
      toast.warn('Client removed')
      await loadClients()
    } catch {
      toast.error('Delete failed')
    }
  }

  /**
   * Open Edit
   */
  const openEditDialog = (client: Vendor) => {
    setSelectedClient(client)
    setIsEditDialogOpen(true)
  }

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase()

    const matchesSearch =
      client.companyName?.toLowerCase().includes(query) ||
      client.contactName?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)

    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'with-stock'
          ? (client.products?.length ?? 0) > 0
          : (client.products?.length ?? 0) === 0

    const matchesOrders = ordersFilter === 'all' ? true : (client.deliveryOrders?.length ?? 0) > 0

    return matchesSearch && matchesStock && matchesOrders
  })
const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">VIP Clients (Vendors)</h2>
          <p className="text-muted-foreground mt-1">Manage vendor accounts, sales orders & stock</p>
        </div>

        <div className="flex gap-2">
          {/* NEW ORDER */}

          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Package className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create VIP Order</DialogTitle>
              </DialogHeader>

              <OrderForm
                onClose={() => setIsOrderDialogOpen(false)}
                clients={clients}
                warehouses={warehouses}
                products={products}
                onSubmit={async (orderData) => {
                  try {
                    const payload = {
                      vendorId: orderData.client,
                      warehouseId: orderData.warehouse,
                      productIds: orderData.products,
                      quantity: orderData.quantity,
                      serviceCharge: Number(orderData.serviceCharge),
                      additionalCharge: Number(orderData.additionalCharge),
                      collectPayment: orderData.collectPayment,
                      amountReceived: Number(orderData.amountReceived),
                      pickupContactName: orderData.pickupContactName,
                      pickupContactPhone: orderData.pickupContactPhone,
                      pickupInstructions: orderData.pickupInstructions,
                      deliveryContactName: orderData.deliveryContactName,
                      deliveryContactPhone: orderData.deliveryContactPhone,
                      deliveryInstructions: orderData.deliveryInstructions,
                      deliveryAddress: orderData.deliveryAddress
                    } as any

                    const res = await window.api.createDeliveryOrder(payload)

                    console.log(res)

                    if (res.error) {
                      toast.error(res.error)
                      return
                    }

                    toast.success('Order created ✔️')
                    setIsOrderDialogOpen(false)
                    await loadClients()
                  } catch {
                    toast.error('Failed to create order')
                  }
                }}
                clientType="vip"
              />
            </DialogContent>
          </Dialog>

          {/* ADD CLIENT */}
          <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add VIP Client</DialogTitle>
              </DialogHeader>

              <VIPClientForm
                onClose={() => setIsClientDialogOpen(false)}
                onSubmit={handleAddClient}
              />
            </DialogContent>
          </Dialog>

          {/* Vendor Summary Drawer */}

          {/* Edit CLIENT */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add VIP Client</DialogTitle>
              </DialogHeader>

              <VIPClientEditForm
                defaultValues={selectedClient}
                onClose={() => setIsClientDialogOpen(false)}
                onSubmit={handleEditClient}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total VIP Clients" value={clients?.length} icon={Package} />
        <MetricCard
          title="Total Orders"
          // @ts-ignore
          value={clients.reduce((a, c) => a + c.orders?.length, 0)}
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Stock Items"
          value={clients.reduce((a, c) => a + c.products?.length, 0)}
          icon={DollarSign}
          variant="warning"
        />
      </div>

      <ClientPerformanceAnalytics setStats={setStats} stats={stats} />

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <Input
              placeholder="Search company, contact, phone or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:max-w-sm"
            />

            {/* Stock Filter */}
            <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as any)}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="with-stock">With Stock</SelectItem>
                <SelectItem value="no-stock">No Stock</SelectItem>
              </SelectContent>
            </Select>

            {/* Orders Filter */}
            <Select value={ordersFilter} onValueChange={(v) => setOrdersFilter(v as any)}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="with-orders">Has Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              )}

              {paginatedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.companyName}</TableCell>

                  <TableCell>{client.contactName ?? '--'}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.email}</TableCell>

                  <TableCell className="text-center">
                    <Badge variant="secondary">{client.deliveryOrders?.length ?? 0}</Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge>{client.products?.length ?? 0}</Badge>
                  </TableCell>

                  <TableCell className="text-right flex gap-2 justify-end">
                    {/* View Vendor */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        navigate('/vendor/' + client.id)
                      }}
                      title="View Vendor Summary"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Edit */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(client)}
                      title="Edit Client"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteClient(client.id)}
                      title="Delete Client"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
              Page {currentPage} of {Math.ceil(filteredClients.length / pageSize)}
            </span>

            <Button
              size="sm"
              disabled={currentPage === Math.ceil(filteredClients.length / pageSize)}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
