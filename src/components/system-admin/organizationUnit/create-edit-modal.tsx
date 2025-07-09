'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateEditModal({ isOpen, onClose }: ItemModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [users, setUsers] = useState<Array<{ action: string; login: string; email: string }>>([])

  const handleAdd = () => {
    if (selectedUser) {
      // In a real app, you'd fetch user details based on selectedUser
      setUsers([
        ...users,
        {
          action: 'Member',
          login: selectedUser,
          email: `${selectedUser}@example.com`,
        },
      ])
      setSelectedUser('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-6">
        <DialogHeader>
          <DialogTitle>Create new roles</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name<span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              placeholder="Enter organization unit name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px]"
              placeholder="Enter description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user" className="text-sm font-medium text-gray-700">
              User
            </Label>
            <div className="flex gap-2">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john.doe">john.doe</SelectItem>
                  <SelectItem value="jane.smith">jane.smith</SelectItem>
                  <SelectItem value="mike.johnson">mike.johnson</SelectItem>
                  <SelectItem value="sarah.wilson">sarah.wilson</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAdd}
                disabled={!selectedUser}
                variant="secondary"
                className="bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                Add
              </Button>
            </div>
          </div>

          {users.length > 0 && (
            <div className="space-y-2">
              <div className="border rounded-md">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-gray-600 font-medium">Action</TableHead>
                      <TableHead className="text-gray-600 font-medium">Login</TableHead>
                      <TableHead className="text-gray-600 font-medium">Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-gray-700">{user.action}</TableCell>
                        <TableCell className="text-gray-700">{user.login}</TableCell>
                        <TableCell className="text-gray-700">{user.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-6">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true)
              // Simulate a save operation (replace with real save logic)
              await new Promise((resolve) => setTimeout(resolve, 1000))
              setIsLoading(false)
              onClose()
            }}
          >
            {isLoading ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
