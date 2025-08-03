'use client'

import { useState } from 'react'
import { subscriptionApi } from '@/lib/api/subscription'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface TrialExpiredModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrialExpiredModal({ open, onOpenChange }: TrialExpiredModalProps) {
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgrade = async () => {
    try {
      setUpgrading(true)
      const redirectUrl = `${window.location.origin}${window.location.pathname}`
      const checkoutUrl = await subscriptionApi.getCheckoutUrl({
        redirectUrl,
      })
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Failed to get checkout URL:', error)
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscription Required</DialogTitle>
          <DialogDescription>
            Your trial has expired or you need an active subscription to perform this action.
            Upgrade to Pro to continue using all features.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpgrade} disabled={upgrading}>
            {upgrading ? 'Redirecting...' : 'Upgrade to Pro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
