'use client'

import {
  Table,
  TableRow,
  TableHeader,
  TableHead,
  TableBody,
  TableCell
} from '@renderer/components/ui/table'

export function WarehouseTable() {
  return (
    <div className="rounded-xl border bg-white shadow-sm p-5">
      <h3 className="text-lg font-semibold mb-4">Warehouse List</h3>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                No warehouses added yet.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
