'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScrollArea } from './ui/scroll-area'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { PackagePlus, Trash, ArrowLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { AddProductForm } from '@renderer/pages/clients/AddproductForm'
import { toast } from 'react-toastify'
import { Input } from './ui/input'

interface VendorSummaryPageProps {
  vendorSummary: any
  vendorId: string
  loadClients: () => void
}

export function VendorSummaryPage({
  vendorSummary,
  vendorId,
  loadClients
}: VendorSummaryPageProps) {
  const navigate = useNavigate()
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || ''
    if (s.includes('active') || s.includes('delivered'))
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    if (s.includes('pending'))
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    if (s.includes('cancelled') || s.includes('inactive'))
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    return 'bg-muted text-muted-foreground'
  }
const [productSearch, setProductSearch] = useState('')
const [orderSearch, setOrderSearch] = useState('')

const [editingProduct, setEditingProduct] = useState<any>(null)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  
  const filteredProducts = vendorSummary?.products.filter((p: any) => {
    const q = productSearch.toLowerCase()
    return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
  })
const filteredOrders = vendorSummary?.orders.filter((o: any) => {
  const q = orderSearch.toLowerCase()
  return (
    o.id?.toLowerCase().includes(q) ||
    o.clientName?.toLowerCase().includes(q) ||
    o.agentName?.toLowerCase().includes(q) ||
    o.status?.toLowerCase().includes(q)
  )
})

  return (
    <div className="h-screen flex flex-col">
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <AddProductForm
              vendorId={vendorId}
              defaultValues={editingProduct}
              onClose={() => setIsEditProductOpen(false)}
              onSubmit={async (data) => {
                const res = await window.api.updateProduct(editingProduct.id, data)
                if (res.success) {
                  toast.success('Product updated')
                  setIsEditProductOpen(false)
                  setEditingProduct(null)
                  loadClients()
                } else {
                  console.log(res.error);
                  
                  toast.error(res.error)
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* PAGE HEADER */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {vendorSummary?.vendor.companyName ?? 'Vendor Summary'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Vendor overview, products, orders & remittances
            </p>
          </div>
        </div>

        <Button onClick={() => setIsProductDialogOpen(true)}>
          <PackagePlus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* PAGE CONTENT */}
      <ScrollArea className="flex-1 px-6 py-6">
        {vendorSummary ? (
          <div className="space-y-6">
            {/* Vendor Info */}
            <Card className="border-l-4 border-l-accent">
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Info label="Contact Name" value={vendorSummary.vendor.contactName} />
                  <Info
                    label="Status"
                    value={
                      <Badge className={getStatusColor(vendorSummary.vendor.status)}>
                        {vendorSummary.vendor.status}
                      </Badge>
                    }
                  />
                  <Info label="Phone" value={vendorSummary.vendor.phone} />
                  <Info label="Email" value={vendorSummary.vendor.email} />
                  <Info label="Address" value={vendorSummary.vendor.address} span />
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <SectionCard title="Products" count={vendorSummary.products.length}>
              <Input
                placeholder="Search product name or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="mb-4 md:max-w-sm"
              />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                      <TableCell className="text-right">₦{p.price}</TableCell>

                      <TableCell className="text-right flex gap-2 justify-end">
                        {/* Edit */}
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => {
                            setEditingProduct(p)
                            setIsEditProductOpen(true)
                          }}
                        >
                          ✏️
                        </Button>

                        {/* Delete */}
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm(`Delete ${p.name}?`)) return

                            const res = await window.api.deleteProduct(p.id)
                            if (res.success) {
                              toast.success('Product deleted')
                              loadClients()
                            } else {
                              toast.error(res.error)
                            }
                          }}
                        >
                          🗑️
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </SectionCard>

            {/* Orders */}
            <SectionCard title="Delivery Orders" count={vendorSummary.orders.length}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="text-accent font-medium">{o.id}</TableCell>
                      <TableCell>{o.clientName ?? '—'}</TableCell>
                      <TableCell>{o.agentName ?? '—'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(o.status)}>{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">${o.amountReceived}</TableCell>
                    </TableRow>
                  ))}

                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </SectionCard>

            {/* Warehouses + Agents */}
            <div className="grid md:grid-cols-2 gap-6">
              <SimpleListCard title="Warehouses" items={vendorSummary.warehouses}>
                {(w: any) => (
                  <>
                    <p className="font-semibold">{w.name}</p>
                    <p className="text-sm text-muted-foreground">{w.location}</p>
                  </>
                )}
              </SimpleListCard>

              <SimpleListCard title="Agents" items={vendorSummary.agents}>
                {(a: any) => (
                  <>
                    <p className="font-semibold">{a.fullName}</p>
                    <p className="text-sm text-muted-foreground">{a.email}</p>
                    <p className="text-sm text-muted-foreground">{a.phone}</p>
                  </>
                )}
              </SimpleListCard>
            </div>

            {/* Remittances */}
            <SectionCard title="Remittances" count={vendorSummary.remittances.length}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Charged</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorSummary.remittances.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">${r.totalCharged ?? 0}</TableCell>
                      <TableCell className="text-right text-accent">
                        ${r.totalReceived ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </div>
        ) : (
          <p className="text-muted-foreground">Loading vendor details…</p>
        )}
      </ScrollArea>

      {/* ADD PRODUCT MODAL */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor Product</DialogTitle>
          </DialogHeader>
          <AddProductForm
            vendorId={vendorId}
            onClose={() => setIsProductDialogOpen(false)}
            onSubmit={async (data) => {
              const res = await window.api.createProduct({ ...data, vendorId })
              if (res.success) {
                toast.success('Product added ✔️')
                setIsProductDialogOpen(false)
                loadClients()
              } else {
                toast.error(res.error)
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------ Helpers ------------------ */

function Info({ label, value, span }: any) {
  return (
    <div className={span ? 'md:col-span-2' : ''}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  )
}

function SectionCard({ title, count, children }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge variant="secondary">{count}</Badge>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function SimpleListCard({ title, items, children }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title} <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item: any) => (
          <div key={item.id} className="p-3 border rounded-md bg-muted/50">
            {children(item)}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
