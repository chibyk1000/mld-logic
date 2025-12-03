import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react'
import { Card, CardContent } from '@renderer/components/ui/card'

import { Button } from './ui/button'
// dfsd
const MetricCard = ({
  icon,
  title,
  value,
  trend,
  trendType, // "up" | "down"
  subtitle
}: {
  icon: React.ReactNode
  title: string
  value: string
  trend: string
  trendType: 'up' | 'down'
  subtitle: string
}) => {
  return (
    <Card className="rounded-2xl border bg-white shadow-none py-0">
      <CardContent className="p-5">
        {/* header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-accent/10 text-accent">
              {icon}
            </div>
            <p className="font-medium text-slate-800">{title}</p>
          </div>

          <MoreHorizontal className="text-slate-400" size={20} />
        </div>

        {/* value */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-primary mt-4">{value}</h2>

          {/* trend */}

          <div className="flex items-center gap-2">
            {trendType === 'up' ? (
              <Button size={'icon-sm'} className="bg-green-50 text-green-600">
                <ChevronUp />
              </Button>
            ) : (
              <Button size={'icon-sm'} className="bg-red-50 text-red-600">
                <ChevronDown />
              </Button>
            )}
            <div
              className={`text-xs mt-2  items-center gap-1 ${
                trendType === 'up' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              <p>{trend}</p>
              <span className="text-slate-500 ">{subtitle}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
export default MetricCard
