import { cn } from '@renderer/lib/utils'

export function StatusBadge({ status }: { status: string }) {
  const styles = {
    'On Delivery': 'bg-blue-100 text-blue-600',
    Pending: 'bg-yellow-100 text-yellow-700',
    Completed: 'bg-green-100 text-green-700'
  }

  return (
    <span
      className={cn(
        'px-3 py-1 rounded-full text-xs font-medium',
        // @ts-ignore
        styles[status] ?? 'bg-gray-100 text-gray-600'
      )}
    >
      {status}
    </span>
  )
}
