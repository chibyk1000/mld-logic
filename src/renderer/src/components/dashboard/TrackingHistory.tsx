import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { MapPin } from 'lucide-react'

export function TrackingHistory() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Tracking History</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tracking ID */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Tracking ID</p>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">In Transit</Badge>
        </div>
        <p className="font-semibold text-lg">#723-2384-de44</p>

        <div className="h-px bg-border" />

        {/* Current Location */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Current Location</p>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <p className="font-medium">Los Angeles, CA</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative pl-6 mt-6 space-y-6">
          {/* Line */}
          <div className="absolute left-[0.4rem] top-3 bottom-3 w-0.5 bg-border"></div>

          {/* Departure */}
          <div className="relative">
            <div className="h-3 w-3 rounded-full bg-primary absolute -left-[1.1rem] top-1 ring-4 ring-background"></div>
            <p className="text-sm text-muted-foreground">Departure Waypoint</p>
            <p className="font-medium mt-1">Las Vegas, NV - USA</p>
          </div>

          {/* Arrival */}
          <div className="relative">
            <div className="h-3 w-3 rounded-full bg-secondary absolute -left-[1.1rem] top-1 ring-4 ring-background"></div>
            <p className="text-sm text-muted-foreground">Arrival Waypoint</p>
            <p className="font-medium mt-1">San Diego, USA</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
