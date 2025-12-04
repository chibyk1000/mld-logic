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
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export function RecentWarehousesTable() {
 

  const [warehouses, setWarehouses] = useState<any>([])
          const loadClients = async () => {
            try {
              const list = await window.api.getDashboardRecentEntities()
             
    console.log(list);
    
              setWarehouses(list.data.recentWarehouses)
            } catch (err) {
              console.error(err)
              toast.error('Failed to load clients.')
            }
          }
    
          useEffect(() => {
            loadClients()
          }, [])
    
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
              <TableHead>Location</TableHead>
              <TableHead>Capacity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((w, i) => (
              <TableRow key={i}>
                <TableCell>{w.name}</TableCell>
                <TableCell>{w.location}</TableCell>
                <TableCell>{w.capacity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
