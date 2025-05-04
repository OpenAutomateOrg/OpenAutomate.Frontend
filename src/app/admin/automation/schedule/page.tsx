'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import DataTable from '@/components/layout/table/table_common'
import { FilterBar } from '@/components/layout/table/filter-bar'
import { CreateEditModal } from '@/components/layout/modal/create-edit-modal'

import { PlusCircle } from 'lucide-react'

// Sample data for Tab A
const tabAData = [
  {
    id: '1',
    name: 'Product A',
    category: 'Electronics',
    status: 'Active',
    price: '$299',
    stock: 45,
  },
  {
    id: '2',
    name: 'Product B',
    category: 'Clothing',
    status: 'Active',
    price: '$59',
    stock: 120,
  },
  {
    id: '3',
    name: 'Product C',
    category: 'Electronics',
    status: 'Inactive',
    price: '$199',
    stock: 0,
  },
  {
    id: '4',
    name: 'Product D',
    category: 'Home',
    status: 'Active',
    price: '$89',
    stock: 32,
  },
  {
    id: '5',
    name: 'Product E',
    category: 'Clothing',
    status: 'Active',
    price: '$49',
    stock: 78,
  },
]

// Sample data for Tab B
const tabBData = [
  {
    id: '1',
    name: 'Customer A',
    email: 'customer.a@example.com',
    region: 'North',
    status: 'Active',
    orders: 12,
  },
  {
    id: '2',
    name: 'Customer B',
    email: 'customer.b@example.com',
    region: 'South',
    status: 'Active',
    orders: 5,
  },
  {
    id: '3',
    name: 'Customer C',
    email: 'customer.c@example.com',
    region: 'East',
    status: 'Inactive',
    orders: 0,
  },
  {
    id: '4',
    name: 'Customer D',
    email: 'customer.d@example.com',
    region: 'West',
    status: 'Active',
    orders: 8,
  },
  {
    id: '5',
    name: 'Customer E',
    email: 'customer.e@example.com',
    region: 'North',
    status: 'Active',
    orders: 3,
  },
]

// Column definitions for Tab A
const tabAColumns = [
  { id: 'name', header: 'Name', accessorKey: 'name' },
  { id: 'category', header: 'Category', accessorKey: 'category' },
  { id: 'status', header: 'Status', accessorKey: 'status' },
  { id: 'price', header: 'Price', accessorKey: 'price' },
  { id: 'stock', header: 'Stock', accessorKey: 'stock' },
]

// Column definitions for Tab B
const tabBColumns = [
  { id: 'name', header: 'Name', accessorKey: 'name' },
  { id: 'email', header: 'Email', accessorKey: 'email' },
  { id: 'region', header: 'Region', accessorKey: 'region' },
  { id: 'status', header: 'Status', accessorKey: 'status' },
  { id: 'orders', header: 'Orders', accessorKey: 'orders' },
]

// Filter options for Tab A
const tabAFilterOptions = [
  {
    id: 'category',
    label: 'Category',
    options: ['All', 'Electronics', 'Clothing', 'Home'],
  },
  { id: 'status', label: 'Status', options: ['All', 'Active', 'Inactive'] },
]

// Filter options for Tab B
const tabBFilterOptions = [
  {
    id: 'region',
    label: 'Region',
    options: ['All', 'North', 'South', 'East', 'West'],
  },
  { id: 'status', label: 'Status', options: ['All', 'Active', 'Inactive'] },
]

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('tab-a')
  const [tabAFilters, setTabAFilters] = useState({})
  const [tabBFilters, setTabBFilters] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Handle row click to navigate to detail page
  const handleRowClick = (item: any) => {
    if (activeTab === 'tab-a') {
      router.push(`/products/${item.id}`)
    } else {
      router.push(`/customers/${item.id}`)
    }
  }

  // Handle edit action from row menu
  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  // Handle create button click
  const handleCreate = () => {
    setSelectedItem(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  // Handle modal submission
  const handleModalSubmit = (data: any) => {
    // In a real app, this would update the data source
    console.log('Form submitted:', data)
    setIsModalOpen(false)
    // Would typically refresh data here
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="tab-a">Tab A</TabsTrigger>
          <TabsTrigger value="tab-b">Tab B</TabsTrigger>
        </TabsList>

        <TabsContent value="tab-a" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Products</h2>
            <Button onClick={handleCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>

          <FilterBar
            filterOptions={tabAFilterOptions}
            filters={tabAFilters}
            onFilterChange={setTabAFilters}
          />

          <DataTable
            data={tabAData}
            columns={tabAColumns}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
          />
        </TabsContent>

        <TabsContent value="tab-b" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Customers</h2>
            <Button onClick={handleCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>

          <FilterBar
            filterOptions={tabBFilterOptions}
            filters={tabBFilters}
            onFilterChange={setTabBFilters}
          />

          <DataTable
            data={tabBData}
            columns={tabBColumns}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>

      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        item={selectedItem}
        schema={activeTab === 'tab-a' ? tabAColumns : tabBColumns}
      />
    </div>
  )
}
