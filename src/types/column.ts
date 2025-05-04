export interface Column<T> {
  id: string
  key: keyof T
  header: string
  accessorKey: string
}
