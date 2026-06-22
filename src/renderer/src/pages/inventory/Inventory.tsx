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
import { Package, AlertTriangle, Save, Plus, Minus, Check, X, ChevronDown } from 'lucide-react'
import { MetricCard } from '@renderer/components/MetricCard'
import { InventoryAddModal } from './inventoryAddModal'
import { toast } from 'react-toastify'
import { useEffect, useRef, useState } from 'react'
import { Vendor } from '../clients/vip'
import { Input } from '@renderer/components/ui/input'

// --- Types ---
type DeltaMode = 'add' | 'remove'

interface InlinePanel {
  mode: DeltaMode
  delta: number
}

// --- Bulk action bar ---
interface BulkBarProps {
  selectedCount: number
  onClear: () => void
  bulkDelta: number
  onBulkDeltaChange: (v: number) => void
  onBulkAdd: () => void
  onBulkRemove: () => void
  isBulkLoading: boolean
}

function BulkActionBar({
  selectedCount,
  onClear,
  bulkDelta,
  onBulkDeltaChange,
  onBulkAdd,
  onBulkRemove,
  isBulkLoading
}: BulkBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-md border mb-3 flex-wrap">
      <span className="text-sm font-medium text-foreground">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>

      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <Input
          type="number"
          value={bulkDelta || ''}
          onChange={(e) => onBulkDeltaChange(parseInt(e.target.value) || 0)}
          placeholder="Qty"
          className="w-20 text-center h-8"
          min={1}
        />
        <Button size="sm" variant="default" onClick={onBulkAdd} disabled={isBulkLoading}>
          <Plus className="w-4 h-4 mr-1" />
          Add to all
        </Button>
        <Button size="sm" variant="destructive" onClick={onBulkRemove} disabled={isBulkLoading}>
          <Minus className="w-4 h-4 mr-1" />
          Remove from all
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={isBulkLoading}>
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  )
}

// --- Main Component ---
export default function Inventory() {
  const [clients, setClients] = useState<Vendor[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [inventories, setInventories] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'in'>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<'all' | string>('all')
  const [vendorFilter, setVendorFilter] = useState<'all' | string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [stats, setStats] = useState<{
    totalItemsInStock: any
    lowStockItems: number
    threshold: number
  }>({ lowStockItems: 0, threshold: 0, totalItemsInStock: 0 })

  // Absolute quantity editors
  const [editableQuantities, setEditableQuantities] = useState<{ [key: string]: number }>({})

  // Per-row inline panel state: id → { mode, delta } | null
  const [inlinePanels, setInlinePanels] = useState<{ [key: string]: InlinePanel | null }>({})

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDelta, setBulkDelta] = useState(0)
  const [isBulkLoading, setIsBulkLoading] = useState(false)

  // ── Loaders ──────────────────────────────────────────────────────────────
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

  const loadInventories = async () => {
    try {
      const list = await window.api.listInventory()
      setInventories(list.data.items)

      const qtyMap: { [key: string]: number } = {}
      list.data.items.forEach((item: any) => {
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

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, warehouseFilter, vendorFilter])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getStatusConfig = (quantity: number) => {
    if (quantity <= 10) return { label: 'Low Stock', variant: 'destructive' as const }
    return { label: 'In Stock', variant: 'default' as const }
  }

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

  const paginatedInventories = filteredInventories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.max(1, Math.ceil(filteredInventories.length / pageSize))

  // ── Absolute quantity save ────────────────────────────────────────────────
  const handleSaveQuantity = async (inventoryId: string) => {
    const newQuantity = editableQuantities[inventoryId]
    if (newQuantity == null || newQuantity < 0) {
      toast.error('Please enter a valid quantity')
      return
    }
    try {
      await window.api.updateInventoryQuanity({ inventoryId, quantity: newQuantity })
      toast.success('Quantity updated')
      loadInventories()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update quantity')
    }
  }

  // ── Per-row inline panel ──────────────────────────────────────────────────
  const openPanel = (inventoryId: string, mode: DeltaMode) => {
    setInlinePanels((prev) => ({ ...prev, [inventoryId]: { mode, delta: 0 } }))
  }

  const closePanel = (inventoryId: string) => {
    setInlinePanels((prev) => ({ ...prev, [inventoryId]: null }))
  }

  const setPanelDelta = (inventoryId: string, delta: number) => {
    setInlinePanels((prev) => {
      const panel = prev[inventoryId]
      if (!panel) return prev
      return { ...prev, [inventoryId]: { ...panel, delta } }
    })
  }

  const confirmPanel = async (inventoryId: string) => {
    const panel = inlinePanels[inventoryId]
    if (!panel || panel.delta <= 0) {
      toast.error('Please enter a quantity greater than 0')
      return
    }

    const currentQty = editableQuantities[inventoryId] ?? 0
    const newQuantity =
      panel.mode === 'add' ? currentQty + panel.delta : Math.max(0, currentQty - panel.delta)

    if (panel.mode === 'remove' && panel.delta > currentQty) {
      toast.error(`Cannot remove more than current stock (${currentQty})`)
      return
    }

    try {
      await window.api.updateInventoryQuanity({ inventoryId, quantity: newQuantity })
      toast.success(
        panel.mode === 'add'
          ? `Added ${panel.delta} unit${panel.delta !== 1 ? 's' : ''}`
          : `Removed ${panel.delta} unit${panel.delta !== 1 ? 's' : ''}`
      )
      closePanel(inventoryId)
      loadInventories()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update stock')
    }
  }

  // ── Bulk selection ────────────────────────────────────────────────────────
  const allPageIds = paginatedInventories.map((i) => i.id)
  const allPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id))
  const somePageSelected = allPageIds.some((id) => selectedIds.has(id))

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        allPageIds.forEach((id) => next.delete(id))
      } else {
        allPageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const handleBulkUpdate = async (mode: DeltaMode) => {
    if (!bulkDelta || bulkDelta <= 0) {
      toast.error('Please enter a quantity greater than 0')
      return
    }

    const ids = Array.from(selectedIds)

    // Validate removes first
    if (mode === 'remove') {
      const invalid = ids.filter((id) => {
        const currentQty = editableQuantities[id] ?? 0
        return bulkDelta > currentQty
      })
      if (invalid.length > 0) {
        const names = invalid
          .map((id) => inventories.find((i) => i.id === id)?.product?.name ?? id)
          .join(', ')
        toast.error(`Cannot remove ${bulkDelta} from: ${names} (insufficient stock)`)
        return
      }
    }

    setIsBulkLoading(true)
    let successCount = 0
    let failCount = 0

    await Promise.all(
      ids.map(async (inventoryId) => {
        const currentQty = editableQuantities[inventoryId] ?? 0
        const newQuantity =
          mode === 'add' ? currentQty + bulkDelta : Math.max(0, currentQty - bulkDelta)
        try {
          await window.api.updateInventoryQuanity({ inventoryId, quantity: newQuantity })
          successCount++
        } catch {
          failCount++
        }
      })
    )

    setIsBulkLoading(false)

    if (successCount > 0) {
      toast.success(
        `${mode === 'add' ? 'Added' : 'Removed'} ${bulkDelta} unit${bulkDelta !== 1 ? 's' : ''} ${mode === 'add' ? 'to' : 'from'} ${successCount} item${successCount !== 1 ? 's' : ''}`
      )
    }
    if (failCount > 0) {
      toast.error(`Failed to update ${failCount} item${failCount !== 1 ? 's' : ''}`)
    }

    setSelectedIds(new Set())
    setBulkDelta(0)
    loadInventories()
  }

  // ── Render ────────────────────────────────────────────────────────────────
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
          </div>

          {/* Bulk action bar — visible when rows are selected */}
          {selectedIds.size > 0 && (
            <BulkActionBar
              selectedCount={selectedIds.size}
              onClear={() => {
                setSelectedIds(new Set())
                setBulkDelta(0)
              }}
              bulkDelta={bulkDelta}
              onBulkDeltaChange={setBulkDelta}
              onBulkAdd={() => handleBulkUpdate('add')}
              onBulkRemove={() => handleBulkUpdate('remove')}
              isBulkLoading={isBulkLoading}
            />
          )}

          <Table>
            <TableHeader>
              <TableRow>
                {/* Select-all checkbox */}
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    className="cursor-pointer"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected
                    }}
                    onChange={toggleSelectAll}
                    title="Select all on this page"
                  />
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Adjust Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInventories.map((item) => {
                const panel = inlinePanels[item.id] ?? null
                const currentQty = editableQuantities[item.id] ?? item.quantity
                const isSelected = selectedIds.has(item.id)

                return (
                  <TableRow key={item.id} className={isSelected ? 'bg-muted/40' : undefined}>
                    {/* Row checkbox */}
                    <TableCell>
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(item.id)}
                      />
                    </TableCell>

                    <TableCell className="font-medium">{item.vendor.companyName}</TableCell>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>{item.product.sku}</TableCell>
                    <TableCell>{item.warehouse.name}</TableCell>

                    {/* Absolute quantity editor */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Input
                          type="number"
                          value={currentQty}
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
                          title="Set quantity"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={getStatusConfig(currentQty).variant}>
                        {getStatusConfig(currentQty).label}
                      </Badge>
                    </TableCell>

                    {/* Inline add / remove panel */}
                    <TableCell className="text-center">
                      {panel ? (
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {/* Mode toggle */}
                          <Badge
                            variant={panel.mode === 'add' ? 'default' : 'destructive'}
                            className="cursor-pointer select-none px-2 py-1 text-xs"
                            onClick={() =>
                              setInlinePanels((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...panel,
                                  mode: panel.mode === 'add' ? 'remove' : 'add'
                                }
                              }))
                            }
                            title="Toggle add / remove"
                          >
                            {panel.mode === 'add' ? (
                              <>
                                <Plus className="w-3 h-3 inline mr-1" />
                                Add
                              </>
                            ) : (
                              <>
                                <Minus className="w-3 h-3 inline mr-1" />
                                Remove
                              </>
                            )}
                          </Badge>

                          <Input
                            type="number"
                            placeholder="Qty"
                            value={panel.delta || ''}
                            onChange={(e) => setPanelDelta(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 text-center"
                            min={1}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') confirmPanel(item.id)
                              if (e.key === 'Escape') closePanel(item.id)
                            }}
                          />

                          <Button
                            size="sm"
                            variant={panel.mode === 'add' ? 'default' : 'destructive'}
                            onClick={() => confirmPanel(item.id)}
                            title="Confirm"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => closePanel(item.id)}
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPanel(item.id, 'add')}
                            title="Add stock"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPanel(item.id, 'remove')}
                            title="Remove stock"
                            disabled={currentQty === 0}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}

              {filteredInventories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
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
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              disabled={currentPage === totalPages}
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
