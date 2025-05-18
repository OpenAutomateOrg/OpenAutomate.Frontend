import { Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalCount?: number
}

export function DataTablePagination<TData>({
  table,
  totalCount,
}: DataTablePaginationProps<TData>) {
  // Get current pagination state from table
  const pagination = table.getState().pagination;
  const pageSize = pagination.pageSize;
  
  // Calculate total items and pages
  const totalItems = totalCount !== undefined ? totalCount : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Current page (1-based for display)
  const currentPage = pagination.pageIndex + 1;
  
  // Navigation state
  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;
  
  // Logging to debug pagination
  useEffect(() => {
    console.log('DataTablePagination - Raw state:', {
      totalCount,
      totalItems,
      pageSize,
      currentPage,
      totalPages,
      canPreviousPage,
      canNextPage,
      tablePageIndex: pagination.pageIndex,
      tablePageSize: pagination.pageSize,
      tablePageCount: table.getPageCount()
    });
  }, [totalCount, totalItems, pageSize, currentPage, totalPages, canPreviousPage, canNextPage, pagination, table]);

  // Navigation functions
  const goToPage = (newPage: number) => {
    // Ensure page is within bounds
    const page = Math.max(1, Math.min(newPage, totalPages));
    
    // Convert to 0-based index for table
    const pageIndex = page - 1;
    
    console.log(`Navigating to page ${page} (index: ${pageIndex})`);
    table.setPageIndex(pageIndex);
  };

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {totalItems > 0 ? (
          <>
            {Math.min(((currentPage - 1) * pageSize) + 1, totalItems)}-
            {Math.min(currentPage * pageSize, totalItems)}{" "}
            of {totalItems} row(s)
          </>
        ) : (
          "No results"
        )}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              const newSize = Number(value);
              
              // When changing page size, try to keep the first item visible
              const firstItemIndex = (currentPage - 1) * pageSize;
              const newPageIndex = Math.floor(firstItemIndex / newSize);
              
              console.log(`Changing page size to ${newSize}, new page index: ${newPageIndex}`);
              table.setPageSize(newSize);
              table.setPageIndex(newPageIndex);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => goToPage(1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => goToPage(currentPage - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => goToPage(currentPage + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => goToPage(totalPages)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
