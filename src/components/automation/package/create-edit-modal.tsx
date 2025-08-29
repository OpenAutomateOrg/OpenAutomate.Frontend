'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { uploadPackageWithAutoCreation } from '@/lib/api/automation-packages'
import { createErrorToast, extractErrorMessage } from '@/lib/utils/error-utils'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

export function CreateEditModal({ isOpen, onClose, mode, onSuccess }: ItemModalProps) {
  const isEditing = mode === 'edit'
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [version, setVersion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // File upload with auto-creation
      if (!file) {
        const errorMsg = 'Please select a package file'
        setError(errorMsg)
        toast({
          title: 'Validation Error',
          description: errorMsg,
          variant: 'destructive',
        })
        return
      }

      const result = await uploadPackageWithAutoCreation({
        file,
        version: version.trim() || undefined,
      })

      // Success toast
      toast({
        title: 'Success',
        description: `Package "${result.name}" uploaded successfully`,
        variant: 'default',
      })

      // Success
      handleClose()
      onSuccess?.()
    } catch (err) {
      console.error('Error creating package:', err)

      // Extract user-friendly error message
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)

      // Show error toast
      toast(createErrorToast(err))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setVersion('')
    setError(null)
    onClose()
  }

  const isValid = file

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[600px] p-6"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Package' : 'Create New Automation Package'}</DialogTitle>
          <DialogDescription>
            Upload a new automation package by selecting a ZIP file containing your bot code. You
            can optionally specify a version number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-2">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {file ? file.name : 'Click to select a bot package file (.zip)'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ZIP files containing bot.py are supported
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Create Package`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
