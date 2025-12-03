import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "./status-badge";

export const columns: ColumnDef<Shipment>[] = [
  {
    accessorKey: "id",
    header: "Shipping ID",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("id")}</span>
    ),
  },
  {
    accessorKey: "company",
    header: "Company",
  },
  {
    accessorKey: "category",
    header: "Product Category",
  },
  {
    accessorKey: "weight",
    header: "Weight",
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => {
      const route = row.getValue("route") as string[];
      return (
        <div className="space-y-1">
          {route.map((r, i) => (
            <p key={i} className="text-purple-600 text-sm font-medium">
              {r}
            </p>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("date") as string[];
      return (
        <div className="space-y-1 text-sm text-slate-700">
          {date.map((d, i) => (
            <p key={i}>{d}</p>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
];
export type Shipment = {
  id: string;
  company: string;
  category: string;
  weight: string;
  route: string[];
  date: string[];
  status: "On Delivery" | "Pending" | "Completed";
};

export const shipments: Shipment[] = [
  {
    id: "#TD6002981",
    company: "StyleHub Co.",
    category: "Electronics",
    weight: "1,200 kg",
    route: ["New York, NY", "Atlanta, GA"],
    date: ["Mar 20, 2025 · 10:00 AM", "Mar 23, 2025 · 03:00 PM"],
    status: "On Delivery",
  },
  {
    id: "#TD6002982",
    company: "FreshNet",
    category: "Kitchenware",
    weight: "1,550 kg",
    route: ["Dallas, TX", "Miami, FL"],
    date: ["Mar 19, 2025 · 11:30 AM", "Mar 22, 2025 · 01:00 PM"],
    status: "Pending",
  },
  {
    id: "#TD6002983",
    company: "FreshNet",
    category: "Kitchenware",
    weight: "1,550 kg",
    route: ["Dallas, TX", "Miami, FL"],
    date: ["Mar 19, 2025 · 11:30 AM", "Mar 22, 2025 · 01:00 PM"],
    status: "On Delivery",
  },
];
