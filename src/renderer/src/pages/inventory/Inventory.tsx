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
import { Plus, Package, AlertTriangle } from 'lucide-react'
import { MetricCard } from '@renderer/components/MetricCard'
import { InventoryAddModal } from './inventoryAddModal'
import { toast } from 'react-toastify'
import { useEffect, useState } from 'react'
import { Vendor } from '../clients/vip'
import { InventoryGetPayload } from 'generated/prisma/models'


type Inventorys = InventoryGetPayload<{
  include: {
    product: true,
    vendor: true,
    warehouse:true
}}>

export default function Inventory() {
  const [clients, setClients] = useState<Vendor[]>([])
  const [warehouses, setWarehouses] = useState([])
const [products, setProducts] = useState([])
const [inventories, setInventories] = useState<Inventorys[]>([])

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
        setInventories(list.data)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load inventories')
      }
    }
  console.log(inventories);
  
    useEffect(() => {
      loadClients()
      loadWarehouses()
      loadProducts()
      loadInventories()
    }, [])
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-muted-foreground mt-1">Track products stored in warehouses</p>
        </div>
        <InventoryAddModal
          vendors={clients}
          onSuccess={() => {}}
          warehouses={warehouses}
          products={products}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Items" value="1,456" icon={Package} />
        <MetricCard title="Low Stock Items" value="23" icon={AlertTriangle} variant="warning" />
        <MetricCard title="Warehouses" value="3" icon={Package} variant="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Stock</CardTitle>
        </CardHeader>
        <CardContent>
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
              {inventories?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.vendor.companyName}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.product.sku}</TableCell>
                  <TableCell>{item.warehouse.name}</TableCell>
                  <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                  <TableCell>
                    {(() => {
                      const s = getStatusConfig(item.quantity)
                      return <Badge variant={s.variant}>{s.label}</Badge>
                    })()}
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
