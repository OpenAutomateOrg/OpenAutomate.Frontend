'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit } from 'lucide-react'

// Sample customer data - in a real app, this would come from an API
const customers = [
  {
    id: '1',
    name: 'Customer A',
    email: 'customer.a@example.com',
    region: 'North',
    status: 'Active',
    orders: 12,
    address: '123 Main St, North City',
    phone: '+1 (555) 123-4567',
  },
  {
    id: '2',
    name: 'Customer B',
    email: 'customer.b@example.com',
    region: 'South',
    status: 'Active',
    orders: 5,
    address: '456 Oak Ave, South Town',
    phone: '+1 (555) 234-5678',
  },
  {
    id: '3',
    name: 'Customer C',
    email: 'customer.c@example.com',
    region: 'East',
    status: 'Inactive',
    orders: 0,
    address: '789 Pine Rd, East Village',
    phone: '+1 (555) 345-6789',
  },
  {
    id: '4',
    name: 'Customer D',
    email: 'customer.d@example.com',
    region: 'West',
    status: 'Active',
    orders: 8,
    address: '101 Cedar Ln, West City',
    phone: '+1 (555) 456-7890',
  },
  {
    id: '5',
    name: 'Customer E',
    email: 'customer.e@example.com',
    region: 'North',
    status: 'Active',
    orders: 3,
    address: '202 Maple Dr, North Town',
    phone: '+1 (555) 567-8901',
  },
]

export default function CustomerDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const customer = customers.find((c) => c.id === params.id)

  if (!customer) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p>Customer not found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Edit Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p>{customer.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Region</h3>
              <p>{customer.region}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <p>{customer.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Orders</h3>
              <p>{customer.orders}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
              <p>{customer.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <p>{customer.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
