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
import {
  PlusCircle,
  Edit,
  Key,
  FileText,
  User,
  X,
  Check,
  Plus,
  AlertCircle,
  Trash,
} from 'lucide-react'

interface ItemModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly mode: 'create' | 'edit'
  readonly onCreated?: () => void
  readonly existingKeys?: string[]
  readonly asset?: AssetEditRow | null
}

type Agent = { id: string; name: string }

export function CreateEditModal({
  isOpen,
  onClose,
  mode,
  onCreated,
  existingKeys = [],
  asset,
}: ItemModalProps) {
  const [value, setValue] = useState('')
  const [key, setKey] = useState('')
  const [type, setType] = useState<number>(0)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const params = useParams()
  const tenant = params.tenant || ''
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [addedAgents, setAddedAgents] = useState<Agent[]>([])
  const [agentError, setAgentError] = useState<string | null>(null)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [typeError, setTypeError] = useState<string | null>(null)
  const [valueError, setValueError] = useState<string | null>(null)
  const isEditing = mode === 'edit'

  const keyInputRef = useRef<HTMLInputElement>(null)
  const valueInputRef = useRef<HTMLInputElement>(null)
  const descInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tenant || !isOpen) return
    const fetchAgents = async () => {
      try {
        const res = await getAllAgents()
        setAgents(res.map((a: Agent) => ({ id: a.id, name: a.name })))
      } catch (err) {
        console.error('Error fetching agents:', err)
      }
    }
    fetchAgents()
  }, [tenant, isOpen])

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.selectionStart = e.target.selectionEnd = e.target.value.length
    }, 0)
  }

  function fillFormFromAsset(asset: AssetEditRow) {
    setKey(asset.key || '')
    const typeValue = typeof asset.type === 'number' ? asset.type : Number(asset.type) || 0
    setType(typeValue)
    setValue(asset.value ?? '')
    setDescription(asset.description || '')
    setAddedAgents(asset.agents?.filter((agent: Agent) => agent?.id && agent?.name) ?? [])
    setTimeout(() => {
      ;[keyInputRef, valueInputRef, descInputRef].forEach((ref) => {
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
    let valid = true
    setKeyError(null)
    setTypeError(null)
    setValueError(null)
    setAgentError(null)

    const vietnameseRegex =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/

    if (!key.trim()) {
      setKeyError('Key is required.')
      valid = false
    } else if (vietnameseRegex.test(key)) {
      setKeyError('Key must not contain Vietnamese characters or accents.')
      valid = false
    } else if (!isEditing && existingKeys.includes(key.trim())) {
      setKeyError('Key already exists. Please choose a unique key.')
      valid = false
    }

    if (!isEditing && !type.toString().trim()) {
      setTypeError('Type is required.')
      valid = false
    }

    if (!value.trim()) {
      setValueError('Value is required.')
      valid = false
    }

    if (addedAgents.length === 0) {
      setAgentError('Please add at least one agent.')
      valid = false
    }

    return valid
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
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
    } catch (err) {
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
    setSelectedAgentId('')
    setAddedAgents([])
    setKeyError(null)
    setTypeError(null)
    setValueError(null)
    setAgentError(null)
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
      setAgentError('Agent already added.')
      return
    }

    const updatedAgents = [...addedAgents, agent]
    setAddedAgents(updatedAgents)
    setSelectedAgentId('')
    setAgentError(null)
  }

  const handleRemoveAgent = (id: string) => {
    const updatedAgents = addedAgents.filter((a: Agent) => a.id !== id)
    setAddedAgents(updatedAgents)
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
      <DialogContent
        className="sm:max-w-[800px] p-0 max-h-[85vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex items-center gap-2 p-6 pb-2 border-b">
          {isEditing ? (
            <Edit className="w-5 h-5 text-primary" />
          ) : (
            <PlusCircle className="w-5 h-5 text-primary" />
          )}
          <DialogTitle className="text-xl font-bold">
            {isEditing ? 'Edit Asset' : 'Create a new Asset'}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="key" className="text-sm font-medium flex items-center gap-1">
                <Key className="w-4 h-4 text-muted-foreground" />
                Key<span className="text-red-500">*</span>
              </Label>
              <Input
                id="key"
                ref={keyInputRef}
                value={key}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setKey(e.target.value)
                  setKeyError(null)
                }}
                className="bg-white text-black dark:text-white border rounded-xl shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoComplete="off"
                onFocus={handleInputFocus}
                spellCheck="false"
              />
              {keyError && (
                <div className="flex items-center gap-1 text-red-500 text-sm mb-2">
                  <AlertCircle className="w-4 h-4" />
                  {keyError}
                </div>
              )}
              <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Description
              </Label>
              <Input
                id="description"
                ref={descInputRef}
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Enter description (optional)"
                className="bg-white text-black dark:text-white border rounded-xl shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoComplete="off"
                onFocus={handleInputFocus}
                spellCheck="false"
              />
            </div>
            <div className="space-y-4">
              <Label htmlFor="type" className="text-sm font-medium flex items-center gap-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Type<span className="text-red-500">*</span>
              </Label>
              {isEditing ? (
                <div className="flex items-center border rounded-xl px-3 py-2 text-sm bg-muted">
                  {type === 0 ? 'String' : 'Secret'}{' '}
                  <span className="text-muted-foreground ml-2 text-xs">(Cannot be changed)</span>
                </div>
              ) : (
                <>
                  <Select
                    value={type.toString()}
                    onValueChange={(v: string) => {
                      setType(Number(v))
                      setTypeError(null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">String</SelectItem>
                      <SelectItem value="1">Secret</SelectItem>
                    </SelectContent>
                  </Select>
                  {typeError && (
                    <div className="flex items-center gap-1 text-red-500 text-sm mb-2">
                      <AlertCircle className="w-4 h-4" />
                      {typeError}
                    </div>
                  )}
                </>
              )}
              <Label htmlFor="value" className="text-sm font-medium flex items-center gap-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Value<span className="text-red-500">*</span>
              </Label>
              <Input
                id="value"
                ref={valueInputRef}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setValue(e.target.value)
                  setValueError(null)
                }}
                placeholder="Type a string value"
                type={inputType}
                className="bg-white text-black dark:text-white border rounded-xl shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoComplete="off"
                onFocus={handleInputFocus}
                spellCheck="false"
              />
              {valueError && (
                <div className="flex items-center gap-1 text-red-500 text-sm mb-2">
                  <AlertCircle className="w-4 h-4" />
                  {valueError}
                </div>
              )}
            </div>
          </form>
          <div className="mt-6">
            <Label htmlFor="agent" className="text-sm font-medium flex items-center gap-1">
              <User className="w-4 h-4 text-muted-foreground" />
              Agent<span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mt-2">
              <Select
                value={selectedAgentId}
                onValueChange={(v: string) => {
                  setSelectedAgentId(v)
                  setAgentError(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent: Agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleAddAgent}
                disabled={!selectedAgentId}
                variant={selectedAgentId ? 'default' : 'secondary'}
                className="flex items-center gap-1 rounded-md px-4 py-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
            {agentError && (
              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                {agentError}
              </div>
            )}
            {addedAgents.length > 0 && (
              <div className="overflow-x-auto mt-4">
                <table className="min-w-[300px] w-full text-sm rounded-xl overflow-hidden border bg-white dark:bg-neutral-900">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border px-3 py-2 text-left font-semibold text-black dark:text-white">
                        #
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold text-black dark:text-white">
                        Agent Name
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold text-black dark:text-white">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {addedAgents.map((agent, idx) => (
                      <tr key={agent.id} className="hover:bg-accent/30 transition">
                        <td className="border px-3 py-2 text-black dark:text-neutral-100">
                          {idx + 1}
                        </td>
                        <td className="border px-3 py-2 text-black dark:text-neutral-100">
                          {agent.name}
                        </td>
                        <td className="border px-3 py-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveAgent(agent.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 border-t bg-background z-10 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-1">
            {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
