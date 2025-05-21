'use client'

import React, { useState, useEffect, useRef } from 'react'
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
import { createAsset, updateAsset, getAllAgents } from '@/lib/api/assets'
import type { AssetEditRow } from './asset'

interface ItemModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly mode: 'create' | 'edit'
  readonly onCreated?: () => void
  readonly existingKeys?: string[]
  readonly asset?: AssetEditRow | null
}

type Agent = { id: string; name: string }

export function CreateEditModal({ isOpen, onClose, mode, onCreated, existingKeys = [], asset }: ItemModalProps) {
  const [value, setValue] = useState('')
  const [key, setKey] = useState('')
  const [type, setType] = useState<number>(0)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const tenant = params.tenant || ''
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [addedAgents, setAddedAgents] = useState<Agent[]>([])
  const isEditing = mode === 'edit'

  const keyInputRef = useRef<HTMLInputElement>(null);
  const valueInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tenant || !isOpen) return;
    const fetchAgents = async () => {
      try {
        const res = await getAllAgents();
        setAgents(res.map((a: Agent) => ({ id: a.id, name: a.name })));
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    };
    fetchAgents();
  }, [tenant, isOpen]);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.selectionStart = e.target.selectionEnd = e.target.value.length;
    }, 0);
  };

  function fillFormFromAsset(asset: AssetEditRow) {
    setKey(asset.key || '')
    const typeValue = typeof asset.type === 'number' ? asset.type : Number(asset.type) || 0
    setType(typeValue)
    setValue(asset.value ?? '')
    setDescription(asset.description || '')
    setAddedAgents(asset.agents?.filter((agent: Agent) => agent?.id && agent?.name) ?? [])
    setTimeout(() => {
      [keyInputRef, valueInputRef, descInputRef].forEach(ref => {
        if (ref.current) {
          ref.current.selectionStart = ref.current.selectionEnd = ref.current.value.length
        }
      })
    }, 100)
  }

  useEffect(() => {
    if (isEditing && asset && isOpen) {
      fillFormFromAsset(asset)
    } else if (!isOpen) {
      resetForm()
    }
  }, [isEditing, asset, isOpen])

  const validateForm = () => {
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

    if (isEditing) {
      if (!key.trim() || !value.trim() || addedAgents.length === 0) {
        setError('Please fill in all required fields and add at least one agent.')
        return false
      }
    } else if (!key.trim() || !type.toString().trim() || !value.trim() || addedAgents.length === 0) {
      setError('Please fill in all required fields and add at least one agent.')
      return false
    }

    if (vietnameseRegex.test(key)) {
      setError('Key must not contain Vietnamese characters or accents.')
      return false
    }

    const trimmedKey = key.trim();
    if (isEditing && asset && trimmedKey === asset.key) {
      return true;
    }

    if (existingKeys.includes(trimmedKey)) {
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
      const agentIds = addedAgents.map((a: Agent) => a.id)
      if (isEditing && asset?.id) {
        await updateAsset(asset.id, { key, description, value }, agentIds)
      } else {
        await createAsset({ key, description, value, type: Number(type), botAgentIds: agentIds })
      }
      resetForm()
      onClose()
      if (onCreated) onCreated()
    } catch (err: unknown) {
      const errorMessage = typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to save asset'
      setError(errorMessage)
      console.error('Error saving asset:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setValue('')
    setKey('')
    setType(0)
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
    if (!agent) return

    if (addedAgents.some((a: Agent) => a.id === agent.id)) {
      return;
    }

    const updatedAgents = [...addedAgents, agent];
    setAddedAgents(updatedAgents);
    setSelectedAgentId('');
  }

  const handleRemoveAgent = (id: string) => {
    const updatedAgents = addedAgents.filter((a: Agent) => a.id !== id);
    setAddedAgents(updatedAgents);
  }

  let buttonText = 'Add Item'
  if (submitting) {
    buttonText = 'Submitting...'
  } else if (isEditing) {
    buttonText = 'Save Changes'
  }

  let inputType: string
  if (isEditing) {
    inputType = asset?.type === 1 ? 'password' : 'text'
  } else {
    inputType = type === 1 ? 'password' : 'text'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle>{isEditing ? 'Edit Asset' : 'Create a new Asset'}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="key" className="text-sm">
                Key<span className="text-red-500">*</span>
              </Label>
              <Input
                id="key"
                ref={keyInputRef}
                value={key}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKey(e.target.value)}
                className="bg-white text-black"
                autoComplete="off"
                onFocus={handleInputFocus}
                spellCheck="false"
              />
              {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm">
                Description
              </Label>
              <Input
                id="description"
                ref={descInputRef}
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
                className="bg-white text-black"
                autoComplete="off"
                onFocus={handleInputFocus}
                spellCheck="false"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type" className="text-sm">
                Type<span className="text-red-500">*</span>
              </Label>
              {isEditing ? (
                <div className="flex items-center border rounded-md px-3 py-2 text-sm bg-muted">
                  {type === 0 ? 'String' : 'Secret'} <span className="text-muted-foreground ml-2 text-xs">(Cannot be changed)</span>
                </div>
              ) : (
                <Select value={type.toString()} onValueChange={(v: string) => setType(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">String</SelectItem>
                    <SelectItem value="1">Secret</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value" className="text-sm">
                Value<span className="text-red-500">*</span>
              </Label>
              <Input
                id="value"
                ref={valueInputRef}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                placeholder="Type a string value"
                type={inputType}
                className="bg-white text-black"
                autoComplete="off"
                onFocus={handleInputFocus}
                spellCheck="false"
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
                <div
                  className={addedAgents.length > 3 ? 'max-h-[200px] overflow-y-auto custom-scrollbar border' : ''}
                  style={addedAgents.length > 3 ? { border: '1px solid var(--border)' } : {}}
                >
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr>
                        <th className="px-2 py-1 border-b">Action</th>
                        <th className="px-2 py-1 border-b">Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addedAgents.map((agent: Agent) => (
                        <tr key={agent.id}>
                          <td className="px-2 py-1 text-center border-b">
                            <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveAgent(agent.id)}>
                              🗑️
                            </Button>
                          </td>
                          <td className="px-2 py-1 border-b">{agent.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 border-t bg-background z-10">
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
