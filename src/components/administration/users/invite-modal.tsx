import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useParams } from 'next/navigation'
import { organizationInvitationsApi } from '@/lib/api/organization-unit-invitations'

interface InviteModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const params = useParams()
  const tenant = params.tenant as string

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast({
        title: 'No email entered',
        description: 'Please enter an email address.',
        variant: 'destructive',
      })
      return
    }
    setIsLoading(true)
    try {
      const check = await organizationInvitationsApi.checkInvitation(tenant, email.trim())
      if (check.invited) {
        toast({
          title: 'Email already invited',
          description: `${email.trim()} has already been invited to this organization.`,
          variant: 'default',
        })
        setIsLoading(false)
        return
      }
      await organizationInvitationsApi.inviteUser(tenant, email.trim())
      toast({
        title: 'Invitation sent',
        description: `Successfully sent invitation to ${email.trim()}`,
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
        title: 'Failed to send invitation',
        description: errorMsg?.includes('already a member of this organization')
          ? 'This user is already a member of this organization.'
          : errorMsg || 'An unknown error occurred',
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
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation email to a new user to join this organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 bg-background border rounded-md p-2 text-sm"
                required
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
