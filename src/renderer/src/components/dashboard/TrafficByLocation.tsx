import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export function TrafficByLocation() {
  const [analytics, setAnalytics] = useState<any[]>([
    { value: 'dfsf', name: 's', color: 'red' },
    { value: '200', name: 's', color: 'blue' }
  ]) // <- initialize as empty array

  const loadClients = async () => {
    try {
      const list = await window.api.getDashboardOrdersByLocation()
      console.log(list)
      

      setAnalytics(list?.pieData || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load clients.')
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Orders by Agents</CardTitle>
      </CardHeader>

      <CardContent className="flex gap-4 items-center justify-center">
        <div className="w-64 h-64">
          {' '}
          {/* larger container */}
          <ResponsiveContainer width="100vh" height="100%">
            <PieChart>
              <Pie
                data={analytics}
                innerRadius={30}
                outerRadius={40}
                paddingAngle={2}
              
                dataKey="value"
                nameKey="name"
              >
                {analytics.map((entry, index) => {
                
                  
                  return <Cell key={index} fill={entry.color} color={entry.color} />
                } )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {analytics.map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground ml-auto">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
