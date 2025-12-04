import { Dispatch, SetStateAction, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@renderer/components/ui/chart'



const chartConfig = {
  requested: {
    label: 'Requested',
    color: 'green'
  },
  delivered: {
    label: 'Delivered',
    color: 'hsl(var(--success))'
  },
  failed: {
    label: 'Failed',
    color: 'hsl(var(--destructive))'
  }
}

export function ClientPerformanceAnalytics({ stats,  }: {
  stats: {
    weekly: {
      period: string;
      requested: number;
      delivered: number;
      failed: number;
    }[];
    monthly: {
      period: string;
      requested: number;
      delivered: number;
      failed: number;
    }[]
  }

  setStats: Dispatch<SetStateAction<{
    weekly: {
      period: string;
      requested: number;
      delivered: number;
      failed: number;
    }[];
    monthly: {
      period: string;
      requested: number;
      delivered: number;
      failed: number;
    }[]
  }>>;

}) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')


    const data = period === 'weekly' ? stats.weekly : stats.monthly
  const totalRequested = data.reduce((sum, item) => sum + item.requested, 0)
  const totalDelivered = data.reduce((sum, item) => sum + item.delivered, 0)
const successRate =
  totalRequested > 0 ? Number(((totalDelivered / totalRequested) * 100).toFixed(1)) : 0


  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Orders Requested</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalRequested}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="text-2xl font-bold text-success mt-1">{totalDelivered}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold text-primary mt-1">{successRate}%</p>
          </div>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'weekly' | 'monthly')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="requested" fill="orange" name="Requested" />
                  <Bar dataKey="delivered" fill="green" name="Delivered" />
                  <Bar dataKey="failed" fill="red" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="requested"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Requested"
                  />
                  <Line
                    type="monotone"
                    dataKey="delivered"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    name="Delivered"
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
