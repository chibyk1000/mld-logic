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

export function RecentAgentsTable() {
  const agents = [
    { name: 'John Smith', orders: 56, status: 'active' },
    { name: 'Sarah Johnson', orders: 48, status: 'active' },
    { name: 'Mike Davis', orders: 31, status: 'active' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Agents</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((a, i) => (
              <TableRow key={i}>
                <TableCell>{a.name}</TableCell>
                <TableCell>{a.orders}</TableCell>
                <TableCell className="capitalize">{a.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
