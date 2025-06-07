'use client'

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, MoreHorizontal, Edit, Trash2, UserPlus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const users = [
  {
    id: 1,
    name: 'Anatoliy Belik',
    email: 'anatoliy.belik@company.com',
    avatar: '/avatars/01.png',
    jobTitle: 'Head of Design',
    department: 'Product',
    site: 'Stockholm',
    salary: '$1,350',
    startDate: 'Mar 13, 2023',
    lifecycle: 'Hired',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Ksenia Bator',
    email: 'ksenia.bator@company.com',
    avatar: '/avatars/02.png',
    jobTitle: 'Fullstack Engineer',
    department: 'Engineering',
    site: 'Miami',
    salary: '$1,500',
    startDate: 'Oct 13, 2023',
    lifecycle: 'Hired',
    status: 'Invited',
  },
  {
    id: 3,
    name: 'Marcus Johnson',
    email: 'marcus.johnson@company.com',
    avatar: '/avatars/03.png',
    jobTitle: 'Product Manager',
    department: 'Product',
    site: 'New York',
    salary: '$2,100',
    startDate: 'Jan 8, 2023',
    lifecycle: 'Hired',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    avatar: '/avatars/04.png',
    jobTitle: 'UX Designer',
    department: 'Design',
    site: 'London',
    salary: '$1,200',
    startDate: 'Jun 20, 2023',
    lifecycle: 'Hired',
    status: 'Inactive',
  },
  {
    id: 5,
    name: 'David Chen',
    email: 'david.chen@company.com',
    avatar: '/avatars/05.png',
    jobTitle: 'DevOps Engineer',
    department: 'Engineering',
    site: 'San Francisco',
    salary: '$1,800',
    startDate: 'Aug 15, 2023',
    lifecycle: 'Hired',
    status: 'Active',
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Active':
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
          Active
        </Badge>
      )
    case 'Invited':
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Invited
        </Badge>
      )
    case 'Inactive':
      return <Badge variant="secondary">Inactive</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 self-start sm:self-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">2,847</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">2,234</div>
            <p className="text-xs text-muted-foreground">+8.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">156</div>
            <p className="text-xs text-muted-foreground">+3.2% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Inactive Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">457</div>
            <p className="text-xs text-muted-foreground">-2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">People</CardTitle>
          <CardDescription className="text-muted-foreground">
            A list of all users in your system including their name, title, email and role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-8" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] min-w-[250px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">Job title</TableHead>
                  <TableHead className="min-w-[100px]">Department</TableHead>
                  <TableHead className="min-w-[80px]">Site</TableHead>
                  <TableHead className="min-w-[80px]">Salary</TableHead>
                  <TableHead className="min-w-[100px]">Start date</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.jobTitle}</TableCell>
                    <TableCell className="text-sm">{user.department}</TableCell>
                    <TableCell className="text-sm">{user.site}</TableCell>
                    <TableCell className="text-sm font-medium">{user.salary}</TableCell>
                    <TableCell className="text-sm">{user.startDate}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit user
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
