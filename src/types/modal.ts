// Props for the CreateEditModal component
export interface CreateEditModalProps<T> {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: T) => void
  mode: ModalMode
  item: T | null
  schema: Column<T>[]
  formFields?: FormField[] // Optional custom form fields
}

export interface FormField {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'email'
  options?: string[] // For select fields
  required?: boolean
  placeholder?: string
}

export type ModalMode = 'create' | 'edit'
export interface Column<T> {
  id: string
  header: string
  accessorKey: keyof T
  cell?: (item: T) => React.ReactNode
}
