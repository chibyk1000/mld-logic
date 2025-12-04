'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Plus, MapPin, Package, CheckCircle, Trash2, FileEdit, Eye } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { toast } from 'react-toastify'
import EditWarehouseModal from './editwarehousemodal'
const initialWarehouses = [
  {
    id: 'WH-001',
    name: 'Central Hub',
    location: 'New York, NY',
    capacity: '85%',
    items: 4250,
    status: 'active',
    agents: ['John Doe', 'Jane Smith']
  },
  {
    id: 'WH-002',
    name: 'West Coast Depot',
    location: 'Los Angeles, CA',
    capacity: '62%',
    items: 2890,
    status: 'active',
    agents: ['Mike Brown']
  }
]

// ------------------- Yup schema -------------------
const warehouseSchema = yup.object({
  name: yup.string().required('Warehouse name is required'),
  location: yup.string().required('Location is required'),
  capacity: yup
    .number()

    .required('Capacity is required'),
  description: yup.string().required('Description is required')
})

type WarehouseFormValues = yup.InferType<typeof warehouseSchema>
export default function WarehouseList() {
  const [warehouses, setWarehouses] = useState(initialWarehouses)

  const [openView, setOpenView] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)

    const {
      register,
      handleSubmit,
      reset,
      formState: { errors }
    } = useForm<WarehouseFormValues>({
      resolver: yupResolver(warehouseSchema)
    })
  

  
const handleAddWarehouse = async (data: WarehouseFormValues) => {
  try {
    // Call the Electron IPC handler

    const result = await window.api.createWarehouse(data as any)

    if (result.error) {
      // Handle error from main process
      toast.error(result.error)
      console.log(result.error)
      return
    }  

    toast.success("warehouse added")

  const d = await window.api.listWarehouses()
  setWarehouses(d.data)
  setOpenAdd(false)
  reset()
  } catch (err) {
    console.error('Failed to add warehouse:', err)
  }
}
  
const handleSubmitEdit = async (data: any) => {
  try {
    // Call the Electron IPC handler

    const result = await window.api.updateWarehouse(selectedWarehouse.id, data)

    if (result.error) {
      // Handle error from main process
      toast.error(result.error)
      console.log(result.error)
      return
    }  

    toast.success("warehouse updated")

  const d = await window.api.listWarehouses()
  setWarehouses(d.data)
  setOpenAdd(false)
  reset()
  } catch (err) {
    console.error('Failed to add warehouse:', err)
  }
}


  const handleEdit = (warehouse: any) => {
    setSelectedWarehouse(warehouse)
    setOpenEdit(true)
  }

  const handleDelete = async (id: string) => {
  try {
    // Call the Electron IPC handler

    const result = await window.api.deleteWarehouse(id)

    if (result.error) {
      // Handle error from main process
      toast.error(result.error)
      console.log(result.error)
      return
    }

    toast.success('warehouse updated')

    const d = await window.api.listWarehouses()
    setWarehouses(d.data)
    setOpenAdd(false)
    reset()
  } catch (err) {
    console.error('Failed to add warehouse:', err)
  }
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
  const handleView = (warehouse: any) => {
    setSelectedWarehouse(warehouse)
    setOpenView(true)
  }
const avgUtilization =
  warehouses.length > 0
    ? (warehouses.reduce((sum, w) => {
        const utilization = w.items / Number(w.capacity) // percentage for this warehouse
        return sum + utilization
      }, 0) /
        warehouses.length) *
      100
    : 0


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
          <p className="text-muted-foreground">Manage your warehouse facilities and inventory</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setOpenAdd(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Warehouses */}
        <Card>
          <CardHeader className="pb-2 flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Warehouses
            </CardTitle>
            <Button size={'icon-sm'} variant={'ghost'} className="bg-accent/10">
              <Package className="h-5 w-5 text-accent" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
          </CardContent>
        </Card>

        {/* Total Capacity */}
        <Card>
          <CardHeader className="pb-2 flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Capacity
            </CardTitle>
            <Button size={'icon-sm'} variant={'ghost'} className="bg-accent/10">
              <MapPin className="h-5 w-5 text-accent" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* @ts-ignore */}
              {warehouses?.reduce((sum, w) => sum + w.capacity, 0)}
            </div>
          </CardContent>
        </Card>

        {/* Average Utilization */}
        <Card>
          <CardHeader className="pb-2 flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Utilization
            </CardTitle>
            <Button size={'icon-sm'} variant={'ghost'} className="bg-accent/10">
              <CheckCircle className="h-5 w-5 text-accent" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtilization }%</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Warehouses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell className="font-medium">{wh.id}</TableCell>
                  <TableCell>{wh.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {wh.location}
                    </div>
                  </TableCell>
                  <TableCell>{wh.capacity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {wh.items}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={wh.status === 'full' ? 'bg-yellow-500' : 'bg-green-600'}>
                      {wh.status}
                    </Badge>
                  </TableCell>
                  <TableCell> </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      className="text-yellow-800"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(wh)}
                    >
                      <FileEdit />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(wh.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleView(wh)}>
                      <Eye />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* -------------------------------------------------- */}
      {/* Add Warehouse Modal */}
      {/* -------------------------------------------------- */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Warehouse</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-4" onSubmit={handleSubmit(handleAddWarehouse)}>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input placeholder="Warehouse name" {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Location</Label>
              <Input placeholder="City, State" {...register('location')} />
              {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input placeholder="Example: 8500" {...register('capacity')} type='number'/>
              {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea placeholder="Description" rows={5} {...register('description')} />
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAdd(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Warehouse</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <EditWarehouseModal
        onDelete={handleDelete}
        onOpenChange={setOpenEdit}
        open={openEdit}
        warehouse={selectedWarehouse}
        onSave={handleSubmitEdit}
      />
      {/* -------------------------------------------------- */}
      {/* View Warehouse Modal */}
      {/* -------------------------------------------------- */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Warehouse Details</DialogTitle>
          </DialogHeader>

          {selectedWarehouse && (
            <div className="mt-4 space-y-4">
              {/* Basic Info */}
              <div className="p-4 border rounded-lg bg-muted/20">
                <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">ID:</span> {selectedWarehouse.id}
                  </p>
                  <p>
                    <span className="font-medium">Name:</span> {selectedWarehouse.name}
                  </p>
                  <p>
                    <span className="font-medium">Location:</span> {selectedWarehouse.location}
                  </p>
                </div>
              </div>

              {/* Capacity & Items */}
              <div className="p-4 border rounded-lg bg-muted/20">
                <h3 className="text-lg font-semibold mb-2">Inventory Details</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Capacity:</span> {selectedWarehouse.capacity}
                  </p>
                  <p>
                    <span className="font-medium">Items:</span> {selectedWarehouse.items}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 border rounded-lg bg-muted/20">
                <h3 className="text-lg font-semibold mb-2">Status</h3>
                <Badge
                  className={
                    selectedWarehouse.status === 'active'
                      ? 'bg-green-600'
                      : selectedWarehouse.status === 'full'
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                  }
                >
                  {selectedWarehouse.status.charAt(0).toUpperCase() +
                    selectedWarehouse.status.slice(1)}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button className="mt-4 w-full" onClick={() => setOpenView(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
