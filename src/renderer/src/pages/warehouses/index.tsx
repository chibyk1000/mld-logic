'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Plus, MapPin, Package, CheckCircle, Trash2, FileEdit, Eye,  } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@renderer/components/ui/command'
import { Checkbox } from '@renderer/components/ui/checkbox'


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
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'full'>('all')

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

  // Inside your WarehouseList component
  const [openTransfer, setOpenTransfer] = useState(false)
  const [transferProducts, setTransferProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])

  const [selectedSourceWarehouse, setSelectedSourceWarehouse] = useState<string | null>(null)
  const [selectedDestinationWarehouse, setSelectedDestinationWarehouse] = useState<string | null>(
    null
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) // Number of warehouses per page

  const [transferNote, setTransferNote] = useState('')

  // Fetch products from the selected source warehouse
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedSourceWarehouse) return
      try {
        const result = await window.api.listWarehouseProducts(selectedSourceWarehouse)

        setTransferProducts(result.data)
      } catch (err) {
        console.error('Failed to fetch products:', err)
      }
    }

    fetchProducts()
  }, [selectedSourceWarehouse])

  const handleStockTransfer = async () => {
    console.log(selectedSourceWarehouse, selectedDestinationWarehouse, selectedProducts)

    if (!selectedSourceWarehouse || !selectedDestinationWarehouse || selectedProducts.length <= 0) {
      toast.error('Please fill all fields with valid values.')
      return
    }

    try {
      const result = await window.api.transferStock({
        fromWarehouseId: selectedSourceWarehouse,
        toWarehouseId: selectedDestinationWarehouse,
        products: selectedProducts,
        note: transferNote
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Stock transfer successful!')
      setOpenTransfer(false)
      setSelectedSourceWarehouse(null)
      setSelectedDestinationWarehouse(null)

      setTransferNote('')
    } catch (err) {
      console.error('Failed to transfer stock:', err)
      toast.error('Stock transfer failed')
    }
  }

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

      toast.success('warehouse added')

      const d = await window.api.listWarehouses()
      setWarehouses(d.data)
      setOpenAdd(false)
      reset()
    } catch (err) {
      console.error('Failed to add warehouse:', err)
    }
  }
useEffect(() => {
  setCurrentPage(1)
}, [searchQuery, statusFilter])

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

      toast.success('warehouse updated')

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
        // console.log(data)
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

  const filteredWarehouses = warehouses.filter((wh) => {
    const matchesSearch =
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.status.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' ? true : wh.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage)

  const paginatedWarehouses = filteredWarehouses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
          <p className="text-muted-foreground">Manage your warehouse facilities and inventory</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setOpenAdd(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>

          <Button
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            onClick={() => setOpenTransfer(true)}
          >
            <Package className="mr-2 h-4 w-4" />
            Stock Transfer
          </Button>
        </div>
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
            <div className="text-2xl font-bold">{avgUtilization}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Warehouses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <Input
              placeholder="Search by name, location, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:max-w-sm"
            />

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              {filteredWarehouses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                    No warehouses found
                  </TableCell>
                </TableRow>
              )}

              {paginatedWarehouses.map((wh) => (
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
          <div className="flex items-center justify-between mt-4">
            <div>
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
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
              <Input placeholder="Example: 8500" {...register('capacity')} type="number" />
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

      {/* Stock Transfer Modal */}
      <Dialog open={openTransfer} onOpenChange={setOpenTransfer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Stock Transfer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Source Warehouse */}
            <div className="space-y-1">
              <Label>Source Warehouse</Label>
              <Select
                value={selectedSourceWarehouse || ''}
                onValueChange={(value) => setSelectedSourceWarehouse(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destination Warehouse */}
            <div className="space-y-1">
              <Label>Destination Warehouse</Label>
              <Select
                value={selectedDestinationWarehouse || ''}
                onValueChange={(value) => setSelectedDestinationWarehouse(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select destination warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    .filter((wh) => wh.id !== selectedSourceWarehouse)
                    .map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <Label>Note (Optional)</Label>
              <Textarea
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                rows={3}
                placeholder="Optional note about this transfer"
              />
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Select Products to Transfer</Label>

              <Command className="border rounded-lg">
                <CommandInput placeholder="Search products..." />
                <CommandList>
                  {transferProducts.length === 0 && <CommandEmpty>No products found.</CommandEmpty>}

                  <CommandGroup>
                    {transferProducts.map((product) => {
                      const selected = selectedProducts.find((p) => p.id === product.productId)

                      return (
                        <CommandItem
                          key={product.id}
                          onSelect={() => {
                            setSelectedProducts((prev) => {
                              if (selected) {
                                // Unselect product
                                return prev.filter((p) => p.id !== product.id)
                              }
                              // Select product with default quantity 1
                              return [...prev, { id: product.productId, quantity: 1 }]
                            })
                          }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selected ? true : false}
                              className={`h-4 w-4 [state=checked]:bg-white!  `}
                            />
                            <span>{product?.productName}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Available: {product.quantity}
                          </span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>

              {/* Quantity inputs for selected products */}
              {selectedProducts.map((p) => {
                const product = transferProducts.find((prod) => prod.productId === p.id)!
                return (
                  <div key={p.id} className="grid items-center gap-1">
                    <span className="flex-1">
                      Quantity of {product.productName} you want to transfer
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={product.quantity}
                      value={p.quantity}
                      onChange={(e) => {
                        const qty = Number(e.target.value)
                        setSelectedProducts((prev) =>
                          prev.map((item) => (item.id === p.id ? { ...item, quantity: qty } : item))
                        )
                      }}
                      className="w-full"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => setOpenTransfer(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockTransfer}>Transfer Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
