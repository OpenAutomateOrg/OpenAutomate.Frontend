import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useLocale } from '@/providers/locale-provider'
import { useParams } from 'next/navigation'
import { organizationInvitationsApi } from '@/lib/api/organization-unit-invitations'

interface InviteModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const params = useParams()
  const tenant = params.tenant as string

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast({
        title: t('administration.users.inviteModal.validation.noEmails'),
        description: t('administration.users.inviteModal.validation.noEmailsDesc'),
        variant: 'destructive',
      })
      return
    }
    setIsLoading(true)
    try {
      const check = await organizationInvitationsApi.checkInvitation(tenant, email.trim())
      if (check.invited) {
        toast({
          title: t('administration.users.inviteModal.alreadyInvited.title'),
          description: `${email.trim()} ${t('administration.users.inviteModal.alreadyInvited.description')}`,
          variant: 'default',
        })
        setIsLoading(false)
        return
      }
      await organizationInvitationsApi.inviteUser(tenant, email.trim())
      toast({
        title: t('administration.users.inviteModal.success.title'),
        description: `${t('administration.users.inviteModal.success.description')} ${email.trim()}`,
      })
      setEmail('')
      onClose()
    } catch (error: unknown) {
      let errorMsg = ''
      if (typeof error === 'object' && error !== null) {
        errorMsg =
          (error as { details?: string; message?: string }).details ??
          (error as { message?: string }).message ??
          ''
      } else if (typeof error === 'string') {
        errorMsg = error
      }
      toast({
        title: t('administration.users.inviteModal.sendFailed.title'),
        description: errorMsg?.includes('already a member of this organization')
          ? t('administration.users.inviteModal.sendFailed.alreadyMember')
          : errorMsg || t('administration.users.inviteModal.sendFailed.unknown'),
        variant: 'destructive',
        style: {
          background: '#ff6a6a',
          color: '#fff',
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-6">
        <DialogHeader>
          <DialogTitle>{t('administration.users.inviteModal.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('administration.users.inviteModal.emailLabel')}</Label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('administration.users.inviteModal.emailPlaceholder')}
                className="flex-1 bg-background border rounded-md p-2 text-sm"
                required
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={onClose} type="button">
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
