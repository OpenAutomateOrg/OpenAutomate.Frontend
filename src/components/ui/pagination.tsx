import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'

export interface PaginationProps {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
  isLoading?: boolean
  isChangingPageSize?: boolean
  pageSizeOptions?: number[]
  rowsLabel?: string
  isUnknownTotalCount?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  isLoading = false,
  isChangingPageSize = false,
  pageSizeOptions = [10, 20, 30, 40, 50],
  rowsLabel = "row(s)",
  isUnknownTotalCount = false,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  // Show transition state when changing page size
  const displayedTotalPages = isChangingPageSize 
    ? Math.max(totalPages, Math.ceil(totalCount / pageSize))
    : totalPages;
  
  // Navigation state
  const canPreviousPage = currentPage > 1
  const canNextPage = currentPage < displayedTotalPages
  
  // Get the display text for total pages
  const getPageDisplayText = () => {
    if (isLoading || isChangingPageSize) {
      return "...";
    }
    
    if (isUnknownTotalCount && canNextPage) {
      return `${displayedTotalPages}+`;
    }
    
    return displayedTotalPages;
  };
  
  // Navigation functions
  const goToPage = (page: number) => {
    // Ensure page is within bounds
    const validPage = Math.max(1, Math.min(page, displayedTotalPages))
    onPageChange(validPage)
  }
  
  const changePage = (delta: number) => {
    const newPage = currentPage + delta;
    goToPage(newPage)
  }
  
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex-1 text-sm text-muted-foreground">
        {totalCount > 0 ? (
          <>
            {Math.min(((currentPage - 1) * pageSize) + 1, totalCount)}-
            {Math.min(currentPage * pageSize, totalCount)}{" "}
            of {totalCount} {rowsLabel}
          </>
        ) : (
          "No results"
        )}
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {currentPage} of {getPageDisplayText()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => goToPage(1)}
            disabled={!canPreviousPage || isLoading}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => changePage(-1)}
            disabled={!canPreviousPage || isLoading}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => changePage(1)}
            disabled={!canNextPage || isLoading}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => goToPage(displayedTotalPages)}
            disabled={!canNextPage || isLoading}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 