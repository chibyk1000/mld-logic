'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader
} from '@renderer/components/ui/table'

export function RecentWarehousesTable() {
  const warehouses = [
    { name: 'Central Hub', capacity: '85%' },
    { name: 'West Coast Depot', capacity: '62%' },
    { name: 'Southern Storage', capacity: '45%' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Warehouses</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Capacity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((w, i) => (
              <TableRow key={i}>
                <TableCell>{w.name}</TableCell>
                <TableCell>{w.capacity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
