'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Column } from '@/types/column'
import DataTable from '@/components/layout/table/table_common'
import { FilterBar } from '@/components/layout/table/filter-bar'
import { CreateEditModal } from '@/components/layout/modal/create-edit-modal'

import { PlusCircle } from 'lucide-react'

// Define the type for the product data
interface Product {
  id: string
  name: string
  category: string
  status: 'Active' | 'Inactive'
  price: string
  stock: number
}

const tabAData: Product[] = [
  {
    id: '1',
    name: 'Product A',
    category: 'Electronics',
    status: 'Active',
    price: '$299',
    stock: 45,
  },
  // ... other products
]

const tabAColumns: Column<Product>[] = [
  { id: 'name', key: 'name' as keyof Product, header: 'Name', accessorKey: 'name' },
  {
    id: 'category',
    key: 'category' as keyof Product,
    header: 'Category',
    accessorKey: 'category',
  },
  { id: 'status', key: 'status' as keyof Product, header: 'Status', accessorKey: 'status' },
  { id: 'price', key: 'price' as keyof Product, header: 'Price', accessorKey: 'price' },
  { id: 'stock', key: 'stock' as keyof Product, header: 'Stock', accessorKey: 'stock' },
]

const tabAFilterOptions = [
  {
    id: 'category',
    label: 'Category',
    options: ['All', 'Electronics', 'Clothing', 'Home'],
  },
  { id: 'status', label: 'Status', options: ['All', 'Active', 'Inactive'] },
]

export default function Dashboard() {
  const router = useRouter()
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedItem, setSelectedItem] = useState<Product | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10 // or any number you want
  const totalPages = Math.ceil(tabAData.length / pageSize)

  const handleRowClick = (item: Product) => {
    router.push(`/products/${item.id}`)
  }

  const handleEdit = (item: Product) => {
    setSelectedItem(item)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedItem(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleModalSubmit = (data: Product) => {
    console.log('Form submitted:', data)
    setIsModalOpen(false)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Products</h2>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create
        </Button>
      </div>

      <FilterBar filterOptions={tabAFilterOptions} filters={filters} onFilterChange={setFilters} />

      <DataTable
        data={tabAData}
        columns={tabAColumns}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={() => {}} // implement if needed
      />

      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        item={selectedItem}
        schema={tabAColumns}
      />
    </div>
  )
}
