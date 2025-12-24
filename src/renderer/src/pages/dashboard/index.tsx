import MetricCard from '@renderer/components/metric-card'
import { Package, Truck, Users, Warehouse } from 'lucide-react'

import { ShipmentsAnalytics } from '@renderer/components/dashboard/ShipmentsAnalytics'
// import { TrackingHistory } from '@renderer/components/dashboard/TrackingHistory'
import { TrafficByLocation } from '@renderer/components/dashboard/TrafficByLocation'

import { RecentAgentsTable } from '@renderer/components/dashboard/ReccentAgentsTable'
import { RecentWarehousesTable } from '@renderer/components/dashboard/RecentWarehouseTable'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export default function Dashboard() {
  const [metrics, setMetrics]=  useState<any>()
      const loadClients = async () => {
        try {
          const list = await window.api.getDashboardMetrics()
          console.log(list);
          
          setMetrics(list.data)
        } catch (err) {
          console.error(err)
          toast.error('Failed to load clients.')
        }
  }
  
  useEffect(() => {
    loadClients()
  },[])
  return (
    <div className="space-y-10 overflow-hidden">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Welcome back. Your logistics performance summary is below.
        </p>
      </div>

      {/* ✅ Only FOUR main stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={<Package size={20} />}
          title="Total Shipments"
          value={metrics?.totalShipments}
          trend="2.9%"
          trendType="up"
          subtitle="this week"
        />
        <MetricCard
          icon={<Truck size={20} />}
          title="Deliveries in Progress"
          value={metrics?.deliveriesInProgress}
          trend="4.2%"
          trendType="up"
          subtitle="live tracking"
        />
        <MetricCard
          icon={<Users size={20} />}
          title="Active Agents"
          value={metrics?.activeAgents}
          trend="1.1%"
          trendType="up"
          subtitle="working today"
        />
        <MetricCard
          icon={<Warehouse size={20} />}
          title="Warehouses"
          value={metrics?.warehouses}
          trend="Stable"
          trendType="up"
          subtitle="across regions"
        />
      </div>

      {/* Analytics Section (keep as is) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ShipmentsAnalytics />
        <TrafficByLocation />
        {/* <TrackingHistory /> */}
      </div>

      {/* ✅ Add Another Table Here (Recent Agents + Warehouses) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentAgentsTable />
        <RecentWarehousesTable />
      </div>

      {/* Our existing traffic + shipments table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {/* <ShipmentsTa ble /> */}
        </div>
      </div>
    </div>
  )
}
