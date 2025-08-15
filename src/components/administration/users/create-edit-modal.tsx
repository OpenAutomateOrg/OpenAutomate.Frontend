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
import { useLocale } from '@/providers/locale-provider'

interface ItemModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function CreateEditModal({ isOpen, onClose }: ItemModalProps) {
  const { t } = useLocale()
  const [emails, setEmails] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [role, setRole] = useState('viewer')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const { toast } = useToast()

  const addEmail = () => {
    const trimmedValue = inputValue.trim().replace(/,$/, '')
    if (trimmedValue && !emails.includes(trimmedValue)) {
      setEmails([...emails, trimmedValue])
      setInputValue('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (emails.length === 0) {
      toast({
        title: t('administration.users.inviteModal.validation.noEmails'),
        description: t('administration.users.inviteModal.validation.noEmailsDesc'),
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: t('administration.users.inviteModal.success.title'),
        description: `${t('administration.users.inviteModal.success.description')} ${emails.length} ${emails.length > 1 ? t('administration.users.inviteModal.users') : t('administration.users.inviteModal.user')}.`,
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
          <DialogTitle>{t('administration.users.inviteModal.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="emails">{t('administration.users.inviteModal.emailLabel')}</Label>
              <div className="flex flex-wrap gap-2 p-2 bg-background rounded-md border min-h-[80px]">
                {emails.map((email, index) => (
                  <div
                    key={email}
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
                  }}
                  placeholder={
                    emails.length === 0
                      ? t('administration.users.inviteModal.emailPlaceholder')
                      : ''
                  }
                  className="flex-1 bg-transparent border-none outline-none min-w-[180px] text-sm p-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('administration.users.inviteModal.emailHint')}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">{t('administration.users.inviteModal.permissionLabel')}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder={t('administration.users.inviteModal.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    {t('administration.users.inviteModal.roles.viewer')}
                  </SelectItem>
                  <SelectItem value="editor">
                    {t('administration.users.inviteModal.roles.editor')}
                  </SelectItem>
                  <SelectItem value="admin">
                    {t('administration.users.inviteModal.roles.admin')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">{t('administration.users.inviteModal.messageLabel')}</Label>
              <Textarea
                id="message"
                placeholder={t('administration.users.inviteModal.messagePlaceholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 rounded-md border p-2">
              <div className="flex-1 text-sm">
                <div className="font-medium">
                  {t('administration.users.inviteModal.shareLink.title')}
                </div>
                <div className="text-muted-foreground">
                  {t('administration.users.inviteModal.shareLink.description')}
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
                {linkCopied
                  ? t('administration.users.inviteModal.shareLink.copied')
                  : t('administration.users.inviteModal.shareLink.copy')}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? t('administration.users.inviteModal.sending')
                : t('administration.users.inviteModal.sendButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
