'use client'

import type React from 'react'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateEditModal({ isOpen, onClose }: ItemModalProps) {
  const [emails, setEmails] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [role, setRole] = useState('viewer')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const { toast } = useToast()

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const addEmail = () => {
    const trimmedValue = inputValue.trim().replace(/,$/, '')
    if (trimmedValue && validateEmail(trimmedValue) && !emails.includes(trimmedValue)) {
      setEmails([...emails, trimmedValue])
      setInputValue('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (emails.length === 0) {
      toast({
        title: 'No emails added',
        description: 'Please add at least one email address.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: 'Invitations sent',
        description: `Invitations sent to ${emails.length} user${emails.length > 1 ? 's' : ''}.`,
      })
      setEmails([])
      setInputValue('')
      setRole('viewer')
      setMessage('')
    }, 1000)
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText('https://yourapp.com/invite/abc123')
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }
  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-6">
        <DialogHeader>
          <DialogTitle>Invite Users</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="emails">Email addresses</Label>
              <div className="flex flex-wrap gap-2 p-2 bg-background rounded-md border min-h-[80px]">
                {emails.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
                  >
                    <span className="text-sm">{email}</span>
                    <button
                      type="button"
                      onClick={() => setEmails(emails.filter((_, i) => i !== index))}
                      className="text-secondary-foreground/70 hover:text-secondary-foreground"
                    >
                      <span className="sr-only">Remove</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
                <input
                  id="emails"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addEmail()
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault()
                    const pastedText = e.clipboardData.getData('text')
                    const pastedEmails = pastedText.split(/[,;\s]+/).filter(Boolean)

                    pastedEmails.forEach((email) => {
                      if (validateEmail(email) && !emails.includes(email)) {
                        setEmails((prev) => [...prev, email])
                      }
                    })
                  }}
                  placeholder={
                    emails.length === 0 ? 'Type or paste email addresses and press Enter' : ''
                  }
                  className="flex-1 bg-transparent border-none outline-none min-w-[180px] text-sm p-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Press Enter or comma after each email. You can also paste multiple emails at once.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Permission</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer (Can view only)</SelectItem>
                  <SelectItem value="editor">Editor (Can edit)</SelectItem>
                  <SelectItem value="admin">Admin (Full access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Add a message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Write a personal message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 rounded-md border p-2">
              <div className="flex-1 text-sm">
                <div className="font-medium">Share invite link</div>
                <div className="text-muted-foreground">
                  Anyone with this link can join your project
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={copyInviteLink}
              >
                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {linkCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Invitations'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
