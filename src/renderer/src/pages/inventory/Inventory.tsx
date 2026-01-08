import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Plus, Package, AlertTriangle, Save } from 'lucide-react'
import { MetricCard } from '@renderer/components/MetricCard'
import { InventoryAddModal } from './inventoryAddModal'
import { toast } from 'react-toastify'
import { useEffect, useState } from 'react'
import { Vendor } from '../clients/vip'
import { InventoryGetPayload } from 'generated/prisma/models'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Input } from '@renderer/components/ui/input'

type Inventorys = InventoryGetPayload<{
  include: {
    product: true
    vendor: true
    warehouse: true
  }
}>

export default function Inventory() {
  const [clients, setClients] = useState<Vendor[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [inventories, setInventories] = useState<Inventorys[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'in'>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<'all' | string>('all')
  const [vendorFilter, setVendorFilter] = useState<'all' | string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10 // Number of rows per page

  const [stats, setStats] = useState<{
    totalItemsInStock: any
    lowStockItems: number
    threshold: number
  }>({ lowStockItems: 0, threshold: 0, totalItemsInStock: 0 })

  // Editable quantity state
  const [editableQuantities, setEditableQuantities] = useState<{ [key: string]: number }>({})

  const loadClients = async () => {
    try {
      const list = await window.api.listVendors()
      setClients(list.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load clients.')
    }
  }
useEffect(() => {
  setCurrentPage(1)
}, [searchQuery, statusFilter, warehouseFilter, vendorFilter])

  const getStatusConfig = (quantity: number) => {
    if (quantity <= 10) {
      return {
        label: 'Low Stock',
        variant: 'destructive' as const
      }
    }
    return {
      label: 'In Stock',
      variant: 'default' as const
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

  const loadInventories = async () => {
    try {
      const list = await window.api.listInventory()
      setInventories(list.data.items)

      // Initialize editableQuantities with current inventory quantities
      const qtyMap: { [key: string]: number } = {}
      list.data.items.forEach((item: Inventorys) => {
        qtyMap[item.id] = item.quantity
      })
      setEditableQuantities(qtyMap)

      setStats(list.data.stats)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load inventories')
    }
  }

  useEffect(() => {
    loadClients()
    loadWarehouses()
    loadProducts()
    loadInventories()
  }, [])

  const filteredInventories = inventories.filter((item) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      item.vendor.companyName.toLowerCase().includes(query) ||
      item.product.name.toLowerCase().includes(query) ||
      item.product?.sku?.toLowerCase().includes(query) ||
      item.warehouse.name.toLowerCase().includes(query)

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'low'
          ? item.quantity <= 10
          : item.quantity > 10

    const matchesWarehouse =
      warehouseFilter === 'all' ? true : item.warehouse.id === warehouseFilter

    const matchesVendor = vendorFilter === 'all' ? true : item.vendor.id === vendorFilter

    return matchesSearch && matchesStatus && matchesWarehouse && matchesVendor
  })

  // Save updated quantity
  const handleSaveQuantity = async (inventoryId: string) => {
    const newQuantity = editableQuantities[inventoryId]
    if (newQuantity == null || newQuantity < 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    try {
      await window.api.updateInventoryQuanity({
        inventoryId,
        quantity: newQuantity
      })
      toast.success('Quantity updated successfully')
      loadInventories()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update quantity')
    }
  }
const paginatedInventories = filteredInventories.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-muted-foreground mt-1">Track products stored in warehouses</p>
        </div>
        <InventoryAddModal
          vendors={clients}
          onSuccess={() => {
            loadInventories()
            loadWarehouses()
          }}
          warehouses={warehouses}
          products={products}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Items" value={stats?.totalItemsInStock} icon={Package} />
        <MetricCard
          title="Low Stock Items"
          value={stats?.lowStockItems}
          icon={AlertTriangle}
          variant="warning"
        />
        <MetricCard title="Warehouses" value={warehouses.length} icon={Package} variant="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap mb-4">
            <Input
              placeholder="Search client, product, SKU, warehouse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:max-w-sm"
            />
            {/* Status, Warehouse, Vendor filters here... */}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Status</TableHead>
              
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInventories.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.vendor.companyName}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.product.sku}</TableCell>
                  <TableCell>{item.warehouse.name}</TableCell>

                  {/* Editable Quantity */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Input
                        type="number"
                        value={editableQuantities[item.id] ?? item.quantity}
                        onChange={(e) =>
                          setEditableQuantities((prev) => ({
                            ...prev,
                            [item.id]: parseInt(e.target.value) || 0
                          }))
                        }
                        className="w-20 text-center"
                        min={0}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveQuantity(item.id)}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        getStatusConfig(editableQuantities[item.id] ?? item.quantity).variant
                      }
                    >
                      {getStatusConfig(editableQuantities[item.id] ?? item.quantity).label}
                    </Badge>
                  </TableCell>

          
                </TableRow>
              ))}
              {filteredInventories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No inventory items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-4">
            <Button
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </Button>

            <span>
              Page {currentPage} of {Math.ceil(filteredInventories.length / pageSize)}
            </span>

            <Button
              size="sm"
              disabled={currentPage === Math.ceil(filteredInventories.length / pageSize)}
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
