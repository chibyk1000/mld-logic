import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const pieData = [
  { name: 'United States', value: 52.1, color: 'hsl(var(--primary))' },
  { name: 'Canada', value: 22.8, color: 'hsl(var(--success))' },
  { name: 'Mexico', value: 13.9, color: 'hsl(var(--destructive))' },
  { name: 'Other', value: 11.2, color: 'hsl(var(--warning))' }
]

export function TrafficByLocation() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Traffic by Location</CardTitle>
      </CardHeader>

      <CardContent className="flex gap-8 items-center justify-center">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={55}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <span
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></span>
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground ml-auto">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
