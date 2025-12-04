'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Plus, Star, Users, UserCheck, TrendingUp, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { Agent, Prisma } from '../../../../../generated/prisma/client'
import * as yup from 'yup'
import { Tooltip, Legend, ResponsiveContainer, BarChart, XAxis, YAxis, Bar } from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { Avatar, AvatarFallback } from '@renderer/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { toast } from 'react-toastify'
import EditAgentModal from './editagents'

// Dummy agent data with assigned warehouse, role, and performance

const agentSchema = yup.object({
  name: yup.string().required('Agent name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  warehouse: yup.string().required('Select a warehouse'),

  status: yup.string().oneOf(['active', 'inactive']).required('Status is required')
})

type AgentFormValues = {
  name: string
  email: string
  phone: string
  warehouse: string
  status: 'active' | 'inactive' 
}

type AgentTypes = Prisma.AgentGetPayload<{ include: { deliveryOrders: true; warehouse: true } }>
export default function AgentList() {
  const [agents, setAgents] = useState<AgentTypes[]>([])
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [warehouses, setWarehouses] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors }
  } = useForm<AgentFormValues>({
    // @ts-ignore
    resolver: yupResolver(agentSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      status: "active",
      warehouse:""
    }
  })

  const submitHandler = async (data: AgentFormValues) => {
    try {
       const { name, warehouse,  ...rest } = data
      const result = await window.api.createAgent({
        ...rest,
        
        fullName: data.name,
        warehouseId: data.warehouse
      })

      if (result.error) {
        // Handle error from main process
        toast.error(result.error)
        console.log(result.error)
        return
      }

      toast.success('Agent added successfully')

        const d = await window.api.listAgents()
        console.log(data)

        setAgents(d.data)
      reset()
 
      setOpenAdd(false)
    } catch (error) {}
  }
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const handleEdit = (agent: AgentTypes) => {
    setSelectedAgent(agent)
    setOpenEdit(true)
    setValue('name', agent.fullName)
    setValue('email', agent.email)
    setValue('phone', agent.phone)
    setValue('warehouse', agent.warehouse.id)
    // setValue('role', agent.role)
    setValue('status', agent.status  as any)
  }
  

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await window.api.listWarehouses()
        setWarehouses(data.data)
      } catch (err) {
        console.error('Failed to fetch warehouses:', err)
      }
    }

    fetchWarehouses()
  }, [])
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await window.api.listAgents()
        console.log(data)

        setAgents(data.data)
      } catch (err) {
        console.error('Failed to fetch warehouses:', err)
      }
    }

    fetchWarehouses()
  }, [])

  const submitEditHandler = async (data: AgentFormValues) => {
    if (!selectedAgent) return

    try {
      const { name, warehouse, ...rest } = data
      const updated = await window.api.updateAgent(selectedAgent.id, {
        ...rest,
        fullName: data.name,
        warehouseId: data.warehouse
      })
      if (updated.error) {
        toast.error(updated.error)
        return
      }
      const d = await window.api.listAgents()
      console.log(data)

      setAgents(d.data)

      setOpenEdit(false)
      toast.success('Agent updated')
    } catch (err) {
      console.error(err)
    }
  }

  // Delete Agent
  const handleDelete = async (id: string) => {
    try {
      await window.api.deleteAgent(id)
         const data = await window.api.listAgents()
         console.log(data)

         setAgents(data.data)
      setOpenEdit(false)
      toast.success('Agent deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete agent')
    }
  }
  const chartData = agents?.map((agent) => {
    // Filter orders based on the report period
    // Here, you would ideally have a `createdAt` field to filter by week/month
    const now = new Date()
    let filteredOrders = agent?.deliveryOrders || []

    if (reportPeriod === 'weekly') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay()) // start of the week (Sunday)
      filteredOrders = filteredOrders.filter((o) => new Date(o.createdAt) >= weekStart)
    } else if (reportPeriod === 'monthly') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      filteredOrders = filteredOrders.filter((o) => new Date(o.createdAt) >= monthStart)
    }

    const assigned = filteredOrders.length
    const completed = filteredOrders.filter((o) => o.status === 'COMPLETED').length
    const failed = filteredOrders.filter((o) => o.status === 'CANCELLED').length

    return {
      name: agent.fullName,
      assigned,
      completed,
      failed
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agents</h2>
          <p className="text-muted-foreground">Manage your delivery agents and track performance</p>
        </div>

        <div className="flex justify-end mb-4 w-40">
          <Select
            value={reportPeriod}
            onValueChange={(value) => setReportPeriod(value as 'weekly' | 'monthly')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="bg-primary text-primary-foreground ml-2 hover:bg-primary/90"
            onClick={() => setOpenAdd(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Agents */}
        <Card>
          <CardHeader className="pb-2 flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Agents
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length }</div>
          </CardContent>
        </Card>

        {/* Active Agents */}
        <Card>
          <CardHeader className="pb-2 flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Agents
            </CardTitle>
            <UserCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.filter((ag)=>ag.status === "active").length }</div>
          </CardContent>
        </Card>

        {/* Avg Rating */}
        {/* <Card>
          <CardHeader className="pb-2 flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Rating</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              4.7 <Star className="h-5 w-5 fill-warning text-warning" />
            </div>
          </CardContent>
        </Card> */}
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Agent Performance</h2>
        </div>

        {/* Chart Card */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Assigned vs Completed vs Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="assigned" fill="#8884d8" name="Assigned" />
                  <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                  <Bar dataKey="failed" fill="#ff6b6b" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const now = new Date()
                let filteredOrders = agent.deliveryOrders || []
                if (reportPeriod === 'weekly') {
                  const weekStart = new Date(now)
                  weekStart.setDate(now.getDate() - now.getDay())
                  filteredOrders = filteredOrders.filter((o) => new Date(o.createdAt) >= weekStart)
                } else {
                  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                  filteredOrders = filteredOrders.filter((o) => new Date(o.createdAt) >= monthStart)
                }
                const assigned = filteredOrders.length
                const completed = filteredOrders.filter((o) => o.status === 'COMPLETED').length

                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {agent.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{agent.fullName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{agent.email}</TableCell>
                    <TableCell>{agent.phone}</TableCell>
                    <TableCell>{agent.warehouse.name}</TableCell>
                    <TableCell>
                      {completed}/{assigned} (
                      {assigned > 0 ? Math.round((completed / assigned) * 100) : 0}%)
                    </TableCell>
                    <TableCell>
                      <Badge className={agent.status === 'active' ? 'bg-green-800' : 'bg-rose-600'}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(agent)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(agent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Agent Modal */}
      <Dialog open={openEdit} onOpenChange={() => setOpenEdit(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            // @ts-ignore
            <form className="space-y-4 mt-4" onSubmit={handleSubmit(submitEditHandler)}>
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input {...register('name')} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input {...register('email')} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input {...register('phone')} />
              </div>
              <div className="space-y-1">
                <Label>Assigned Warehouse</Label>
                <Controller
                  control={control}
                  name="warehouse"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <DialogFooter className="flex justify-between">
                <Button variant="destructive" onClick={() => handleDelete(selectedAgent.id)}>
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOpenEdit(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Agent Modal */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Agent</DialogTitle>
          </DialogHeader>
          {/* @ts-ignore */}
          <form className="space-y-4 mt-4" onSubmit={handleSubmit(submitHandler)}>
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input placeholder="Agent name" {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Input placeholder="Email address" {...register('email')} />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Phone</Label>
              <Input placeholder="Phone number" {...register('phone')} />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Assigned Warehouse</Label>
              <Select
                value={watch().warehouse}
                onValueChange={(value) => {
                  setValue('warehouse', value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true
                  })
                }}
              >
                <SelectTrigger className="w-full text-primary">
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehouse && (
                <p className="text-red-500 text-sm">{errors.warehouse.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={watch().status} onValueChange={(v) => setValue('status', v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenAdd(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Agent</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Modal */}
      {/* Edit Agent Modal */}
      <EditAgentModal
        agent={selectedAgent}
        onDelete={handleDelete}
        onOpenChange={setOpenEdit}
        open={openEdit}
        onSave={(data) => {
          submitEditHandler(data)
        }}
        warehouses={warehouses}
      />
    </div>
  )
}
