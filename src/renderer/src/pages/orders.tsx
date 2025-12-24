  'use client'

  import { useEffect, useState } from 'react'
  import { toast } from 'react-toastify'

  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
  } from '@renderer/components/ui/card'
  import { Badge } from '@renderer/components/ui/badge'
  import { Button } from '@renderer/components/ui/button'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
  } from '@renderer/components/ui/select'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '@renderer/components/ui/dropdown-menu'

  import { EditOrderModal } from '@renderer/components/edit-order-modal'
  import { Trash2, MoreHorizontal,  } from 'lucide-react'
const ORDER_STATUSES = ['pending', 'in-progress', 'delivered', 'cancelled'] as const

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  export function OrdersList() {
    const [orders, setOrders] = useState<any[]>([])
    const [agents, setAgents] = useState<any[]>([])
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>('all')



    const handleUpdateStatus = async (orderId: string, status: string) => {
      try {
        /* @ts-ignore */
        await window.api.updateDeliveryStatus(orderId, status)

        toast.success('Order status updated')
        loadOrders()
      } catch (err) {
        toast.error('Failed to update order status')
      }
    }


    const loadOrders = async () => {
      try {
        const list = await window.api.listDeliveryOrders()
        const agentList = await window.api.listAgents()
  console.log(list);

        setAgents(agentList.data)
        setOrders(list.data)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load orders.')
      }
    }

    useEffect(() => {
      loadOrders()
    }, [])

    // const handleEditClick = (order: any) => {
    //   setSelectedOrder(order)
    //   setIsEditModalOpen(true)
    // }

      const handleDeleteClick = async (id: string) => {
        console.log(id);
        
      if (!confirm('Are you sure you want to delete this order?')) return

      try {
      //   await window.api.deleteOrder(id)
        toast.success('Order deleted')
        loadOrders()
      } catch {
        toast.error('Failed to delete order')
      }
      }
      
      console.log(orders);
      

    const handleAssignAgent = async (orderId: string, agentId: string) => {
        try {
              
                /* @ts-ignore */
        await window.api.assignAgent(orderId, agentId === 'Unassigned' ? null : agentId)
        toast.success('Agent assigned successfully')
        loadOrders()
      } catch (err) {
        toast.error('Failed to assign agent')
      }
    }

    const filteredOrders =
      orders?.filter((order) => (filterStatus === 'all' ? true : order.status.toLowerCase() === filterStatus.toLowerCase())) ?? []

    return (
      <div className="space-y-6">
        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Orders Management</span>
              <div className="w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
            <CardDescription>Manage, edit, and assign orders to agents</CardDescription>
          </CardHeader>
        </Card>

        {/* Orders Table */}
        <Card className='p-0'>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="px-6 py-3 text-left">Order #</th>
                    <th className="px-6 py-3 text-left">Client</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Agent</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Charge</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const orderNumber = `ORD-${order.id.slice(0, 6).toUpperCase()}`
                    const clientName = order.client?.fullName || order.vendor?.companyName || 'Unknown'

                    return (
                      <tr key={order.id} className="border-b hover:bg-muted/50">
                        <td className="px-6 py-4 font-medium">{orderNumber}</td>

                        <td className="px-6 py-4">
                          <p className="font-medium">{clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.client ? 'regular' : 'vip'}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          
                          <Select
                            value={order.status.toLowerCase()}
                            onValueChange={(val) => handleUpdateStatus(order.id, val)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              {ORDER_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  <Badge className={statusColors[status]}>
                                    {status.replace('-', ' ')}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="px-6 py-4">
                          <Select
                            value={order.agentId || 'Unassigned'}
                            onValueChange={(val) => handleAssignAgent(order.id, val)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {agent.fullName}
                                </SelectItem>
                              ))}
                              <SelectItem value="Unassigned">Unassigned</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="px-6 py-4">₦{order.amountReceived}</td>
                        <td className="px-6 py-4">
                          ₦{order.serviceCharge + order.additionalCharge}
                        </td>

                        <td className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              {/* <DropdownMenuItem onClick={() => handleEditClick(order)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Order
                              </DropdownMenuItem> */}

                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(order.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No orders found with the selected filter.
              </div>
            )}
          </CardContent>
        </Card>

        {selectedOrder && (
          <EditOrderModal
            order={selectedOrder}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={() => {
              toast.success('Order updated')
              loadOrders()
              setIsEditModalOpen(false)
            }}
          />
        )}
      </div>
    )
  }
