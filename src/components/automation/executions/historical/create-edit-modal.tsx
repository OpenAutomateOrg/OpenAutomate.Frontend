'use client'

import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
}

export function CreateEditModal({ isOpen, onClose, mode }: ItemModalProps) {
  const isEditing = mode === 'edit'
  const defaultTab = 'agent'

  const handleSubmit = async () => {
    console.log('handleSubmit')
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Agent' : 'Create a new Agent'}</DialogTitle>
          <DialogDescription>
            Review and configure the execution details for your automation task.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="workflow" className="text-sm font-medium">
              Workflow<span className="text-red-500">*</span>
            </label>
          </div>
          <Select>
            <SelectTrigger id="workflow" className="w-full">
              <SelectValue placeholder="Choose workflow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workflow1">Workflow 1</SelectItem>
              <SelectItem value="workflow2">Workflow 2</SelectItem>
              <SelectItem value="workflow3">Workflow 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-[250px] border-b rounded-none">
            <TabsTrigger
              value="agent"
              className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:shadow-none rounded-none"
            >
              Agent
            </TabsTrigger>
            <TabsTrigger
              value="parameters"
              className="text-red-500 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:shadow-none rounded-none"
            >
              Parameters
            </TabsTrigger>
          </TabsList>
          <TabsContent value="agent" className="pt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search" className="pl-8" />
            </div>
            <div className="mt-4 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead className="font-medium">
                      Name <span className="text-xs">▼</span>
                    </TableHead>
                    <TableHead className="font-medium">
                      Machine name <span className="text-xs">▼</span>
                    </TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No data...
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="parameters" className="pt-4">
            <div className="mb-4">
              <Button variant="outline" className="bg-gray-200 hover:bg-gray-300">
                Add
              </Button>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="font-medium">Action</TableHead>
                    <TableHead className="font-medium">Parameter Name</TableHead>
                    <TableHead className="font-medium">Type</TableHead>
                    <TableHead className="font-medium">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No data...
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>

          <Button onClick={handleSubmit}>Creating</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
