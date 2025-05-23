'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  HeaderGroup,
  Header,
  Row,
  Cell,
  Table as ReactTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<TData, TValue> {
  readonly columns: ColumnDef<TData, TValue>[]
  readonly data: TData[]
  readonly table?: ReactTable<TData>
  readonly onRowClick?: (row: TData) => void
  readonly isLoading?: boolean
  readonly totalCount?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  table: externalTable,
  onRowClick,
  isLoading = false,
  totalCount,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const internalTable = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),

    // Always enable manual pagination when totalCount is provided
    ...(totalCount !== undefined && {
      manualPagination: true,
      pageCount: Math.max(1, Math.ceil(totalCount / 10)), // Default page size is 10
    }),
  })

  const table = externalTable ?? internalTable

  // Debug totalCount prop
  React.useEffect(() => {
    console.log('DataTable component received totalCount:', totalCount)
    if (table) {
      const pageSize = table.getState().pagination.pageSize;
      const calculatedPageCount = totalCount !== undefined ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;

      console.log('DataTable pagination state:', {
        totalCount,
        pageSize,
        calculatedPageCount,
        tablePageCount: table.getPageCount(),
        currentPage: table.getState().pagination.pageIndex + 1,
        pageIndex: table.getState().pagination.pageIndex,
      })
    }
  }, [totalCount, table])

  // Handler for row clicks that checks if we should navigate
  const handleRowClick = (e: React.MouseEvent, row: TData) => {
    // If the click target is inside a cell with id 'select' or 'actions', don't trigger row click
    const target = e.target as HTMLElement;

    // Check if the click is inside a dialog or dropdown menu
    if (
      target.closest('[role="dialog"]') ||
      target.closest('[data-state="open"]') ||
      target.closest('.dialog') ||
      target.closest('.dropdown-menu')
    ) {
      return;
    }

    // Check if the click is inside a select or actions cell
    const cellElement = target.closest('td');
    if (cellElement) {
      // Get the column id from the cell's data attribute if possible
      const columnId = cellElement.getAttribute('data-column-id');

      // If the cell is part of the select checkbox column or actions column, don't navigate
      if (columnId === 'select' || columnId === 'actions') {
        return;
      }
    }

    // Otherwise proceed with the row click handler
    onRowClick?.(row);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: Header<TData, unknown>) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<TData>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={(e) => onRowClick && handleRowClick(e, row.original)}
                >
                  {row.getVisibleCells().map((cell: Cell<TData, unknown>) => {
                    let cellClass = '';
                    if (cell.column.id === 'select') {
                      cellClass = 'w-12 min-w-[48px] max-w-[48px] px-2';
                    } else if (cell.column.id === 'actions') {
                      cellClass = 'w-16 min-w-[60px] max-w-[60px] px-2';
                    }
                    return (
                      <TableCell
                        key={cell.id}
                        data-column-id={cell.column.id}
                        className={cellClass}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? 'Loading...' : 'No results.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Commented out the built-in pagination component since we're using a custom one */}
      {/* <DataTablePagination table={table} totalCount={totalCount} /> */}
    </div>
  )
}
