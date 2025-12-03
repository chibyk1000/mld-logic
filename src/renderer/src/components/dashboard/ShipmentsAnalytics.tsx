import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const chartData = [
  { name: 'Jan', shipment: 70, delivery: 85 },
  { name: 'Feb', shipment: 50, delivery: 45 },
  { name: 'Mar', shipment: 65, delivery: 70 },
  { name: 'Apr', shipment: 35, delivery: 20 },
  { name: 'May', shipment: 60, delivery: 75 },
  { name: 'Jun', shipment: 40, delivery: 60 },
  { name: 'Jul', shipment: 55, delivery: 68 },
  { name: 'Aug', shipment: 72, delivery: 88 },
  { name: 'Sep', shipment: 50, delivery: 30 },
  { name: 'Oct', shipment: 58, delivery: 62 },
  { name: 'Nov', shipment: 66, delivery: 78 },
  { name: 'Dec', shipment: 75, delivery: 90 }
]

export function ShipmentsAnalytics() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Shipments Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }}
            />
            <Legend verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: '20px' }} />
            <Bar
              dataKey="shipment"
              name="Shipments"
              barSize={16}
              fill="#032C4C"
              className="hover:bg-red-600"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="delivery"
              name="Deliveries"
              barSize={16}
              fill="oklch(0.73 0.13 70)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
