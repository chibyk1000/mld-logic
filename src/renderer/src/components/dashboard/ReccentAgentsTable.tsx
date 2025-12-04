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

export function RecentAgentsTable() {

  

    const [agents, setAgents] = useState<any>([])
        const loadClients = async () => {
          try {
            const list = await window.api.getDashboardRecentEntities()
           
  
            setAgents(list.data.recentAgents)
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
        <CardTitle>Recent Agents</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((a, i) => (
              <TableRow key={i}>
                <TableCell>{a.fullName}</TableCell>
                <TableCell>{a.phone}</TableCell>
                <TableCell className="capitalize">{a.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
