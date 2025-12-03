import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { cn } from '@renderer/lib/utils'
import { LucideIcon } from 'lucide-react'


interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default'
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
    destructive: 'bg-rose-600/10 text-rose-600'
  }

  return (
    <Card className="shadow-sm  transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('p-2 rounded-lg', variantStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {trend && (
          <p className={cn('text-xs mt-1', trend.positive ? 'text-green-500' : 'text-rose-500')}>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
