'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useParams } from 'next/navigation'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  onCreated?: () => void
  existingKeys?: string[]
}

export function CreateEditModal({ isOpen, onClose, mode, onCreated, existingKeys = [] }: ItemModalProps) {
  const [value, setValue] = useState('')
  const [key, setKey] = useState('')
  const [type, setType] = useState('0')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const tenant = params.tenant || ''
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [addedAgents, setAddedAgents] = useState<{ id: string, name: string }[]>([])
  const isEditing = mode === 'edit'

  useEffect(() => {
    if (!tenant || !isOpen) return;

    const fetchAgents = async () => {
      try {
        const { api } = await import('@/lib/api/client');
        const res = await api.get<{ id: string; name: string }[]>(`${tenant}/api/agents`);
        setAgents(res.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })));
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    };

    fetchAgents();
  }, [tenant, isOpen]);

  const validateForm = () => {
    if (!key.trim()) return false
    if (!type.trim()) return false
    if (!value.trim()) return false
    if (addedAgents.length === 0) return false
    if (existingKeys.includes(key.trim())) {
      setError('Key already exists. Please choose a unique key.')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        key,
        description,
        value,
        botAgentIds: addedAgents.map((a) => a.id),
        type: Number(type)
      }
      await import('@/lib/api/client').then(({ api }) =>
        api.post(`${tenant}/api/assets`, payload)
      )
      resetForm()
      onClose()
      if (onCreated) onCreated()
    } catch (err: unknown) {
      setError(
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to create asset',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddAgent = () => {
    if (!selectedAgentId) return;
    const agent = agents.find((a: { id: string, name: string }) => a.id === selectedAgentId);
    if (!agent) return;
    if (addedAgents.some((a: { id: string, name: string }) => a.id === agent.id)) return;
    setAddedAgents([...addedAgents, { id: agent.id, name: agent.name }]);
    setSelectedAgentId('');
  };

  const handleRemoveAgent = (id: string) => {
    setAddedAgents(addedAgents.filter((a: { id: string, name: string }) => a.id !== id));
  };

  const resetForm = () => {
    setValue('')
    setKey('')
    setType('')
    setDescription('')
    setError(null)
    setSelectedAgentId('')
    setAddedAgents([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Asset' : 'Create a new Asset'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="key" className="text-sm">
              Key<span className="text-red-500">*</span>
            </Label>
            <Input id="key" value={key} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKey(e.target.value)} />
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm">
              Description
            </Label>
            <Input id="description" value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} placeholder="Enter description (optional)" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type" className="text-sm">
              Type<span className="text-red-500">*</span>
            </Label>
            <Select value={type} onValueChange={(v: string) => setType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">String</SelectItem>
                <SelectItem value="1">Secret</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="value" className="text-sm">
              Value<span className="text-red-500">*</span>
            </Label>
            <Input
              id="value"
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
              placeholder="Type a string value"
              type={type === '1' ? 'password' : 'text'}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent" className="text-sm">
              Agent<span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Select value={selectedAgentId} onValueChange={(v: string) => setSelectedAgentId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent: { id: string; name: string }) => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleAddAgent} disabled={!selectedAgentId}>
                Add
              </Button>
            </div>
          </div>
          {addedAgents.length > 0 && (
            <div className="mt-4">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Action</th>
                    <th className="border px-2 py-1">Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {addedAgents.map((agent: { id: string; name: string }) => (
                    <tr key={agent.id}>
                      <td className="border px-2 py-1 text-center">
                        <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveAgent(agent.id)}>
                          🗑️
                        </Button>
                      </td>
                      <td className="border px-2 py-1">{agent.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>{isEditing ? 'Save Changes' : 'Add Item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
