'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import { Download } from 'lucide-react'
import { toast } from 'react-toastify'


type ExportFormat = 'json' | 'csv' | 'excel' | 'sql'

const EXPORT_FORMATS: {
  id: ExportFormat
  label: string
  description: string
}[] = [
  { id: 'json', label: 'JSON', description: 'Structured raw data' },
  { id: 'csv', label: 'CSV', description: 'Spreadsheet-friendly format' },
  { id: 'excel', label: 'Excel (.xlsx)', description: 'Multi-sheet workbook' },
  { id: 'sql', label: 'SQL Backup', description: 'Full database backup' }
]

const EXPORT_OPTIONS = [
  { id: 'orders', label: 'Orders Data', description: 'All order records' },
  { id: 'summary', label: 'Orders Summary', description: 'Order count, status breakdown, revenue' },
  { id: 'agents', label: 'Agent Assignments', description: 'Agent names and assigned orders' }
]

export function SettingsPage() {
 const [isImporting, setIsImporting] = useState(false)

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(['orders']))
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const [isExporting, setIsExporting] = useState(false)
const [orders, setOrders] = useState<any[]>([])
      const loadOrders = async () => {
        try {
          const list = await window.api.listDeliveryOrders()
         
          console.log(list);
          
          setOrders(list.data)
        } catch (err) {
          console.error(err)
          toast.error('Failed to load orders')
        }
    }
    

    useEffect(() => {
    loadOrders()    
    }, [])
  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const handleExport = async () => {
    if (selectedItems.size === 0) {
      toast.error('Select at least one item to export')
      return
    }

    setIsExporting(true)

    try {
      // Lightweight exports (browser-side)
      if (exportFormat === 'json') {
        exportAsJSON()
        toast.success('JSON export completed')
        return
      }

      if (exportFormat === 'csv') {
        exportAsCSV()
        toast.success('CSV export completed')
        return
      }

      // Heavy exports (Electron-side)
      if (exportFormat === 'excel') {
        const res = await window.api.exportExcel('DeliveryOrder')
        if (res?.path) toast.success('Excel file exported')
        return
      }

      if (exportFormat === 'sql') {
        const res = await window.api.exportSQL()
        if (res?.path) toast.success('SQL backup created')
        return
      }
    } catch (err) {
      console.error(err)
      toast.error('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDatabaseImport = async (file: File) => {
    if (!file) return

    if (!file.name.endsWith('.sql') && !file.name.endsWith('.db')) {
      toast.error('Only .sql or .db files are allowed')
      return
    }

    setIsImporting(true)

    try {
      const arrayBuffer = await file.arrayBuffer()

      const res = await window.api.importDatabase(
        file.name,
     Array.from(new Uint8Array(arrayBuffer))
      )

      if (res?.success) {
        toast.success('Database imported successfully. Restarting app...')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(res?.error || 'Import failed')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to import database')
    } finally {
      setIsImporting(false)
    }
  }

  const generateSummary = () => {
    const statuses = {
      pending: orders.filter((o) => o.status.toLowerCase() === 'pending').length,
      'in-progress': orders.filter((o) => o.status.toLowerCase() === 'inprogress').length,
      completed: orders.filter((o) => o.status.toLowerCase() === 'completed').length,
      cancelled: orders.filter((o) => o.status.toLowerCase() === 'cancelled').length
    }
    const totalRevenue = orders.reduce((sum, o) => sum + o.serviceCost + o.additionalCost, 0)

    return {
      totalOrders: orders.length,
      statuses,
      totalRevenue,
      exportedAt: new Date().toISOString()
    }
  }

  const generateAgentAssignments = () => {
    const agents: Record<string, any> = {}
    orders.forEach((order) => {
      const agent = order.agentAssigned || 'Unassigned'
      if (!agents[agent]) {
        agents[agent] = { name: agent, orderCount: 0, orders: [] }
      }
      agents[agent].orderCount++
      agents[agent].orders.push(order.orderNumber)
    })
    return agents
  }

  const prepareExportData = () => {
    const data: Record<string, any> = {}

    if (selectedItems.has('orders')) {
      data.orders = orders
    }
    if (selectedItems.has('summary')) {
      data.summary = generateSummary()
    }
    if (selectedItems.has('agents')) {
      data.agentAssignments = generateAgentAssignments()
    }

    return data
  }

  const exportAsJSON = () => {
    const data = prepareExportData()
    const json = JSON.stringify(data, null, 2)
    downloadFile(json, `orders-export-${Date.now()}.json`, 'application/json')
  }

  const exportAsCSV = () => {
    const data = prepareExportData()
    let csv = ''

    if (selectedItems.has('orders')) {
      csv += 'Order Data\n'
      csv += 'Order #,Client,Type,Status,Agent,Pickup,Delivery,Cost,Created\n'
      data.orders.forEach((order: any) => {
        csv += `"${order.orderNumber}","${order.clientName}","${order.clientType}","${order.status}","${order.agentAssigned || 'Unassigned'}","${order.pickupLocation}","${order.deliveryLocation}",${order.totalCost},"${order.createdAt}"\n`
      })
      csv += '\n\n'
    }

    if (selectedItems.has('summary')) {
      csv += 'Summary Data\n'
      csv += 'Metric,Value\n'
      csv += `Total Orders,${data.summary.totalOrders}\n`
      csv += `Pending,${data.summary.statuses.pending}\n`
      csv += `In Progress,${data.summary.statuses['in-progress']}\n`
      csv += `Completed,${data.summary.statuses.completed}\n`
      csv += `Cancelled,${data.summary.statuses.cancelled}\n`
      csv += `Total Revenue,${data.summary.totalRevenue}\n`
      csv += '\n\n'
    }

    if (selectedItems.has('agents')) {
      csv += 'Agent Assignments\n'
      csv += 'Agent,Order Count,Orders\n'
      Object.values(data.agentAssignments).forEach((agent: any) => {
        csv += `"${agent.name}",${agent.orderCount},"${agent.orders.join(', ')}"\n`
      })
    }

    downloadFile(csv, `orders-export-${Date.now()}.csv`, 'text/csv')
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    setIsExporting(true)
    setTimeout(() => {
      const element = document.createElement('a')
      element.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(content)}`)
      element.setAttribute('download', filename)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      setIsExporting(false)
    }, 500)
  }
useEffect(() => {
  if (exportFormat === 'sql') {
    setSelectedItems(new Set(['orders']))
  }
}, [exportFormat])

  // const handleExport = () => {
  //   if (selectedItems.size === 0) {
  //     alert('Please select at least one item to export')
  //     return
  //   }
  //   if (exportFormat === 'json') {
  //     exportAsJSON()
  //   } else {
  //     exportAsCSV()
  //   }
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Settings</h2>
        <p className="text-muted-foreground">Manage your database exports and preferences</p>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Database Export</CardTitle>
          <CardDescription>Select the data you want to export</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Items Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Select Items to Export</h3>
            <div className="space-y-3 pl-2">
              {EXPORT_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={option.id}
                    checked={selectedItems.has(option.id)}
                    onCheckedChange={() => toggleItem(option.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.id}
                      className="cursor-pointer font-medium text-foreground"
                    >
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="font-semibold text-foreground">Export Format</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {EXPORT_FORMATS.map((format) => (
                <label
                  key={format.id}
                  className={`flex cursor-pointer flex-col rounded-lg border p-4 transition
        ${
          exportFormat === format.id
            ? 'border-primary bg-primary/5'
            : 'border-muted hover:bg-muted/50'
        }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.id}
                    checked={exportFormat === format.id}
                    onChange={() => setExportFormat(format.id)}
                    className="hidden"
                  />

                  <span className="font-medium">{format.label}</span>
                  <span className="text-xs text-muted-foreground">{format.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <div className="border-t pt-6 flex justify-end">
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedItems.size === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Import</CardTitle>
          <CardDescription>Restore a previously exported database (.sql or .db)</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm text-destructive font-medium">⚠ Warning</p>
            <p className="text-sm text-muted-foreground">
              Importing a database will <strong>overwrite your current data</strong>. This action
              cannot be undone.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".sql,.db"
              className="hidden"
              id="db-import"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleDatabaseImport(file)
              }}
            />

            <Label
              htmlFor="db-import"
              className="cursor-pointer inline-flex items-center gap-2 rounded-md border px-4 py-2 hover:bg-muted"
            >
              📂 Choose Database File
            </Label>

            {isImporting && (
              <span className="text-sm text-muted-foreground">Importing database…</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Database Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">{orders.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {orders.filter((o) => o.status === 'completed').length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {orders.filter((o) => o.status === 'in-progress').length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">
                ${orders.reduce((sum, o) => sum + o.totalCost, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
