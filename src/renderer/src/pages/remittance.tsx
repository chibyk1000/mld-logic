import { MetricCard } from "@renderer/components/MetricCard";
import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@renderer/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@renderer/components/ui/table";
import { CheckCircle, Clock, DollarSign } from "lucide-react";


const remittances = [
  {
    id: 1,
    client: "TechStore Inc",
    orderCount: 15,
    paymentReceived: "$3,450",
    serviceCost: "$450",
    remittanceDue: "$3,000",
    status: "pending",
  },
  {
    id: 2,
    client: "Fashion Hub",
    orderCount: 22,
    paymentReceived: "$5,280",
    serviceCost: "$660",
    remittanceDue: "$4,620",
    status: "pending",
  },
  {
    id: 3,
    client: "Electronics World",
    orderCount: 18,
    paymentReceived: "$4,140",
    serviceCost: "$540",
    remittanceDue: "$3,600",
    status: "completed",
  },
];

export default function Remittance() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">
          Remittance Ledger
        </h2>
        <p className="text-muted-foreground mt-1">
          Track vendor payments and remittances
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Pending"
          value="$12,450"
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="Completed This Month"
          value="$28,340"
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Service Fees Earned"
          value="$4,230"
          icon={DollarSign}
          variant="destructive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Remittances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Payment Received</TableHead>
                <TableHead className="text-right">Service Cost</TableHead>
                <TableHead className="text-right">Remittance Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {remittances.map((remittance) => (
                <TableRow key={remittance.id}>
                  <TableCell className="font-medium">
                    {remittance.client}
                  </TableCell>
                  <TableCell className="text-center">
                    {remittance.orderCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {remittance.paymentReceived}
                  </TableCell>
                  <TableCell className="text-right">
                    {remittance.serviceCost}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {remittance.remittanceDue}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        remittance.status === "completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {remittance.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {remittance.status === "pending" && (
                      <Button size="sm">Mark Paid</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
