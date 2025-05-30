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
import { createAsset } from '@/lib/api/assets'

interface ItemModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly mode: 'create' | 'edit'
  readonly onCreated?: () => void
  readonly existingKeys?: string[]
}

type Agent = { id: string; name: string }

export function CreateEditModal({ isOpen, onClose, mode, onCreated, existingKeys = [] }: ItemModalProps) {
  const [value, setValue] = useState('')
  const [key, setKey] = useState('')
  const [type, setType] = useState('0')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const tenant = params?.tenant || ''
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [addedAgents, setAddedAgents] = useState<Agent[]>([])
  const isEditing = mode === 'edit'

  useEffect(() => {
    if (!tenant || !isOpen) return;
    const fetchAgents = async () => {
      try {
        const { api } = await import('@/lib/api/client');
        const res = await api.get<Agent[]>(`${tenant}/api/agents`);
        setAgents(res.map((a: Agent) => ({ id: a.id, name: a.name })));
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    };
    fetchAgents();
  }, [tenant, isOpen]);

  const validateForm = () => {
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
    if (!key.trim() || !type.trim() || !value.trim() || addedAgents.length === 0) {
      setError('Please fill in all required fields and add at least one agent.')
      return false
    }
    if (vietnameseRegex.test(key)) {
      setError('Key must not contain Vietnamese characters or accents.')
      return false
    }
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
        botAgentIds: addedAgents.map((a: Agent) => a.id),
        type: Number(type)
      }
      await createAsset(payload)
      resetForm()
      onClose()
      if (onCreated) onCreated()
    } catch (err: unknown) {
      const errorMessage = typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to create asset'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setValue('')
    setKey('')
    setType('0')
    setDescription('')
    setError(null)
    setSelectedAgentId('')
    setAddedAgents([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleAddAgent = () => {
    if (!selectedAgentId) return
    const agent = agents.find((a: Agent) => a.id === selectedAgentId)
    if (!agent || addedAgents.some((a: Agent) => a.id === agent.id)) return
    setAddedAgents([...addedAgents, agent])
    setSelectedAgentId('')
  }

  const handleRemoveAgent = (id: string) => {
    setAddedAgents(addedAgents.filter((a: Agent) => a.id !== id))
  }

  let buttonText = 'Add Item'
  if (submitting) {
    buttonText = 'Submitting...'
  } else if (isEditing) {
    buttonText = 'Save Changes'
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
                  {agents.map((agent: Agent) => (
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
                  {addedAgents.map((agent: Agent) => (
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
          <Button onClick={handleSubmit} disabled={submitting}>
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
