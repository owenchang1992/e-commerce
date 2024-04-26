'use client'

import { useMemo, useState, useTransition } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, CheckCircle2, ChevronDown, MoreHorizontal, MoreVertical, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/formatter"
import { Product } from "@prisma/client"
import Link from "next/link"
import _ from 'lodash'
import { deleteProduct, updateProductAvailability } from "../../_actions/products"
import { useRouter } from "next/navigation"

type SelectField = Pick<Product, "id" | "price" | "name" | "isAvailableForPurchase">
type ResultProduct = SelectField & {
  _count: {
    orders: number
  }
}

type FormattedProductColumn = SelectField & {
  orders: number
}

export const columns: ColumnDef<FormattedProductColumn>[] = [
  {
    accessorKey: "isAvailableForPurchase",
    header: "",
    cell: ({ row }) => (
      row.getValue("isAvailableForPurchase")
        ? <>
          <span className="sr-only">Available</span>
          <CheckCircle2 />
        </>
        : <>
          <span className="sr-only">Unavailable</span>
          <XCircle className="stroke-destructive"/>
        </>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          className="px-0 hover:bg-inherit rounded-none"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div className="lowercase">{row.getValue("description")}</div>,
  },
  {
    accessorKey: "price",
    header: () => <div className="text-left">Price</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))

      // Format the amount as a dollar amount
      const formatted = formatCurrency(price)

      return <div className="text-left font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "orders",
    header: "Orders",
    cell: ({ row }) => {
      return <div className="lowercase">{row.getValue("orders")}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    size: 48,
    minSize: 48,
    maxSize: 48,
    cell: ({ row }) => {
      const product = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <a download href={`/admin/products/${product.id}/download`}>
                Download
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${product.id}/edit`}>
                Edit
              </Link>
            </DropdownMenuItem>
            <ActiveToggleDropdownItem id={product.id} isAvailableForPurchase={product.isAvailableForPurchase}/>
            {/** It's unavailable to delete product if orders exist */}
            <DropdownMenuSeparator />
            <DeleteDropdownItem id={product.id} disabled={product.orders > 0}/>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export const ActiveToggleDropdownItem = ({ id, isAvailableForPurchase }: { id: string, isAvailableForPurchase: boolean }) => {
  const [isPending, startTransition] = useTransition();
  const route = useRouter()

  return (
    <DropdownMenuItem
      disabled={isPending}
      onClick={() => { startTransition( async () => {
        await updateProductAvailability(id, !isAvailableForPurchase)
        route.refresh()
      })}}
    >
      {isAvailableForPurchase ? "Deactivate" : "Activate"}
    </DropdownMenuItem>
  )
}

export const DeleteDropdownItem = ({ id, disabled = false }: { id: string, disabled?: boolean }) => {
  const [isPending, startTransition] = useTransition();
  const route = useRouter()

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={isPending || disabled}
      onClick={() => {
        startTransition(async () => {
          await deleteProduct(id)
          route.refresh()
        })
      }}
    >
      Delete
    </DropdownMenuItem>
  )
}

export default function ProductsTable({ data }: { data: ResultProduct[] } ) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const formattedData = useMemo(() => data.map((product) => ({
    ..._.omit(product, ['_count']),
    ...product._count
  })), [data])

  const table = useReactTable({
    data: formattedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4 space-x-4">
        <Input
          placeholder="Filter product name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="flex-1"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto" size="icon">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
