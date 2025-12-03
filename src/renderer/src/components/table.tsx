'use client'

import * as React from 'react'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Calendar, Filter } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@renderer/components/ui/dropdown-menu'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { shipments, columns } from './columns'

export function ShipmentsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data: shipments,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  })

  return (
    <div className="w-full rounded-2xl border bg-white shadow-sm p-5">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Shipments Data</h2>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input
            placeholder="Search id, company, etc"
            className="w-full md:w-80"
            value={(table.getColumn('id')?.getFilterValue() as string) ?? ''}
            onChange={(e) => table.getColumn('id')?.setFilterValue(e.target.value)}
          />

          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={16} /> Filter
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar size={16} />
                March 2025
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>February 2025</DropdownMenuItem>
              <DropdownMenuItem>January 2025</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
        <p>Show 12 of 300 results</p>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="ghost" size="sm">
            2
          </Button>
          <Button variant="ghost" size="sm">
            3
          </Button>
          <Button variant="ghost" size="sm">
            …
          </Button>
          <Button variant="ghost" size="sm">
            30
          </Button>
        </div>
      </div>
    </div>
  )
}
