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
import { Plus, TrendingUp, DollarSign, Users, Pencil, Trash2 } from 'lucide-react'
import { MetricCard } from '@renderer/components/MetricCard'
import { OrderForm } from '@renderer/components/OrderForm'
import { ClientPerformanceAnalytics } from '@renderer/components/ClientPerformanceAnalytics'
import { RegularClientForm } from '@renderer/pages/clients/regularClientForm'
import { toast } from 'react-toastify'
import { ClientGetPayload, DeliveryOrderGetPayload } from 'generated/prisma/models'
import { RegularClientEditForm } from '@renderer/components/ClientEditForm'





export type Clients = ClientGetPayload<{
  include: {
  deliveryOrders:true
}}>
type Orders = DeliveryOrderGetPayload<{
  include: {
    vendor: true
    client: true
    product: true
    agent: true
  }
}>
export default function RegularClients() {
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [clients, setClients] = useState<Clients[]>([])
  const [orders, setOrders] = useState<Orders[]>([])
  const [totals, setTotals] = useState<{
    successRate: number
    totalDelivered: number
    totalFailed: number
    totalRequested: number
    totalRevenue: number
  }>({
    totalRequested: 1,
    totalDelivered: 0,
    totalFailed: 0,
    totalRevenue: 0,
    successRate: 0
  })
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
      
    }>({
      monthly: [],
      weekly: [],
   
    })

    const loadStats = async () => {
      try {
        const list = await window.api.getClientStats()
        console.log(list)
        if (list) {
          
          setStats(list.data)
          setTotals(list.data .totals)
        }
        } catch (err) {
          console.error(err)
        toast.error('Failed to load products')
      }
  } 
  console.log(clients);
  
  const loadClients = async () => {
    try {
      const list = await window.api.listClients()
  
      
      setClients(list.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load products')
    }
  }
  const loadOrders = async () => {
    try {
      const list = await window.api.listDeliveryOrders()
     
      
      setOrders(list.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load products')
    }
  }

 
  useEffect(() => {
    loadClients()
    loadStats()
    loadOrders()
  }, [])

  const handleEditClient = async (data: any) => {
    if (!selectedClient) return
    try {
 
      const { deliveryOrders, ...rest } =  data
      const res = await window.api.updateClient(selectedClient.id, rest)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Client updated ✔️')
      setIsEditOpen(false)
      setSelectedClient(null)
      loadClients()
    } catch (err) {
      console.log(err);
      
      toast.error('Failed to update client')
    }
  }

  
  // Delete client
  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    try {
      await window.api.deleteClient(id)
      toast.warn('Client removed')
      loadClients()
    } catch {
      toast.error('Failed to delete client')
    }
  }

  // Open edit modal
  const openEditModal = (client: any) => {
    setSelectedClient(client)
    setIsEditOpen(true)
  }

  const filteredOrders = orders.filter((order) => order.client !== null)

  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Regular Clients</h2>
          <p className="text-muted-foreground mt-1">On-demand pick & drop and errand services</p>
        </div>
        <div className="space-x-4">
          <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
            <DialogTrigger asChild>
              <Button variant={'secondary'}>
                <Plus className="mr-2 h-4 w-4" />
                Add Regular Client
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Regular Client</DialogTitle>
              </DialogHeader>

              <RegularClientForm
                onClose={() => setIsClientDialogOpen(false)}
                onSubmit={async (data) => {
                  console.log('New client:', data)
                  // TODO → call backend
                  const res = await window.api.createClient(data)

                  if (res.error) {
                    toast.error(res.error)
                    return
                  }
                  toast.success('Client added')
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Order Request
              </Button>
            </DialogTrigger> 
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Order Request</DialogTitle>
              </DialogHeader>
              <OrderForm
                onClose={() => setIsOrderDialogOpen(false)}
                clients={clients}

                onSubmit={async (data) => {
                  try {

                    if (!data.client) {
                      return  toast.error("please select client")
                    }
                    const payload = {
                      clientId: data.client,
                      destination: data.destination,
                      quantity: data.quantity,
                      serviceCost: Number(data.serviceCost)
                    } as any


                    const res = await window.api.createClientDeliveryOrder(payload)

                    loadOrders()

                    if (res.error) {
                      toast.error(res.error)
                      return
                    }
                    toast.success('Order created ✔️')
                    setIsOrderDialogOpen(false)
                    await loadClients()
                    return
                  } catch {      
                    toast.error('Failed to create order')
                    return
                  }
                }}   
                clientType="regular"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Edit Client Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <RegularClientEditForm
              defaultValues={selectedClient}
              onClose={() => setIsEditOpen(false)}
              onSubmit={handleEditClient}
            />
          )}
        </DialogContent>
      </Dialog>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Customers" value={clients.length } icon={Users} />
        <MetricCard title="Completed Orders" value={totals?.totalDelivered} icon={TrendingUp} variant="success" />
        <MetricCard title="Total Revenue" value={totals?.totalRevenue} icon={DollarSign} variant="success" />
      </div>

      <ClientPerformanceAnalytics setStats={setStats} stats={stats}/>

      <Card>
        <CardHeader>
          <CardTitle>Recent Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
          
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  {/*  @ts-ignore */}
                  <TableCell>{order?.client.fullName}</TableCell>
                  {/*  @ts-ignore */}
                  <TableCell>{order?.client.phone}</TableCell>
                {/* @ts-ignore */}
                  <TableCell className="font-medium">{order.deliveryCost + order.serviceCost}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Regular Clients table</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.fullName}</TableCell>
                  <TableCell>{order.phone}</TableCell>
                  <TableCell className="font-medium">{order.address}</TableCell>
                  <TableCell className="font-medium">{order.email}</TableCell>

                  <TableCell className="text-right flex gap-2 justify-end">
                    {/* Edit */}
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => openEditModal(order)}
                      title="Edit Client"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDeleteClient(order.id)}
                      title="Delete Client"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
