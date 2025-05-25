'use client'

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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import {
  uploadPackageWithAutoCreation,
  createAutomationPackage,
  CreateAutomationPackageDto,
} from '@/lib/api/automation-packages'
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
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useManualInput, setUseManualInput] = useState(false)

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

      if (useManualInput) {
        // Manual package creation without file
        if (!name.trim()) {
          const errorMsg = 'Package name is required'
          setError(errorMsg)
          toast({
            title: 'Validation Error',
            description: errorMsg,
            variant: 'destructive',
          })
          return
        }

        const packageData: CreateAutomationPackageDto = {
          name: name.trim(),
          description: description.trim() || name.trim(),
        }

        await createAutomationPackage(packageData)
        
        // Success toast
        toast({
          title: 'Success',
          description: `Package "${packageData.name}" created successfully`,
          variant: 'default',
        })
      } else {
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
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          version: version.trim() || undefined,
        })
        
        // Success toast
        toast({
          title: 'Success',
          description: `Package "${result.name}" uploaded successfully`,
          variant: 'default',
        })
      }

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
    setName('')
    setDescription('')
    setVersion('')
    setError(null)
    setUseManualInput(false)
    onClose()
  }

  const isValid = useManualInput ? name.trim() : file

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Package' : 'Create New Automation Package'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Mode Toggle */}
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant={!useManualInput ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseManualInput(false)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Package File
            </Button>
            <Button
              type="button"
              variant={useManualInput ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseManualInput(true)}
            >
              Manual Entry
            </Button>
          </div>

          {!useManualInput ? (
            <>
              {/* File Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Package File</Label>
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

              {/* Optional Override Fields */}
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Optional: Override metadata extracted from the package file
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Package Name (optional)</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Override extracted name..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Version (optional)</Label>
                    <Input
                      id="version"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="Override extracted version..."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Override extracted description..."
                    rows={3}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Manual Entry Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Package Name *</Label>
                  <Input
                    id="manual-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter package name..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manual-description">Description</Label>
                  <Textarea
                    id="manual-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter package description..."
                    rows={3}
                  />
                </div>
              </div>
            </>
          )}

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
