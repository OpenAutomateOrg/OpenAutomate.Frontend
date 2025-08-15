'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { Download, Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { exportAssetsToCsv, importAssetsFromCsv } from '@/lib/api/assets'
import type { CsvImportResultDto } from '@/types/assets'
import { CsvTemplateHelper } from './csv-template-helper'

interface CsvImportExportProps {
  onImportComplete?: (result: CsvImportResultDto) => void
}

export function CsvImportExport({ onImportComplete }: CsvImportExportProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // States for export
  const [isExporting, setIsExporting] = useState(false)
  const [includeSecrets, setIncludeSecrets] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // States for import
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<CsvImportResultDto | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)

  const openExportDialog = () => {
    setIncludeSecrets(false) // Reset to safe default
    setShowExportDialog(true)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const blob = await exportAssetsToCsv(includeSecrets)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `assets_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setShowExportDialog(false)
      toast({
        title: 'Success',
        description: 'Assets exported successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export assets',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File',
          description: 'Please select a CSV file',
          variant: 'destructive',
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        })
        return
      }

      setSelectedFile(file)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      })
      return
    }

    setIsImporting(true)
    try {
      const result = await importAssetsFromCsv(selectedFile)
      setImportResult(result)
      setShowImportDialog(false)
      setShowResultDialog(true)

      if (result.successfulImports > 0) {
        onImportComplete?.(result)
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import assets',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const openImportDialog = () => {
    setSelectedFile(null)
    setShowImportDialog(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openExportDialog}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={openImportDialog}
          disabled={isImporting}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Assets from CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>CSV Format Requirements</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    <strong>Required columns:</strong> Key, Value, Type
                  </div>
                  <div>
                    <strong>Optional columns:</strong> Description
                  </div>
                  <div>
                    <strong>Type values:</strong> &quot;String&quot; or &quot;Secret&quot; (defaults to &quot;String&quot; if empty)
                  </div>
                  <div>
                    <strong>Description:</strong> Can be empty or up to 500 characters
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <strong>🔄 Update Behavior:</strong> If an asset with the same Key already exists, it will be updated with new values.
                  </div>
                  <div className="mt-2">
                    <CsvTemplateHelper />
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isImporting}
              />
            </div>

            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Importing...
                </>
              ) : (
                'Import'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {importResult.successfulImports}
                        </div>
                        <div className="text-sm text-muted-foreground">Successful</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <X className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {importResult.failedImports}
                        </div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <div>Total rows processed: {importResult.totalRows}</div>
                {(importResult.assetsCreated > 0 || importResult.assetsUpdated > 0) && (
                  <div className="flex gap-4">
                    {importResult.assetsCreated > 0 && (
                      <span className="text-green-600">✓ {importResult.assetsCreated} created</span>
                    )}
                    {importResult.assetsUpdated > 0 && (
                      <span className="text-blue-600">{importResult.assetsUpdated} updated</span>
                    )}
                  </div>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Errors ({importResult.errors.length})</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-2 border-red-500">
                          {error}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Options Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Assets to CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-secrets-dialog"
                checked={includeSecrets}
                onCheckedChange={(checked) => setIncludeSecrets(!!checked)}
              />
              <Label htmlFor="include-secrets-dialog" className="text-sm font-medium">
                Include actual secret values in export
              </Label>
            </div>

            {includeSecrets && (
              <Alert variant="destructive" className="text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Warning</AlertTitle>
                <AlertDescription>
                  Secret values will be exported in plain text. Ensure the CSV file is handled securely and not shared inappropriately.
                </AlertDescription>
              </Alert>
            )}

            {!includeSecrets && (
              <Alert className="text-sm">
                <FileText className="h-4 w-4" />
                <AlertTitle>Default Export</AlertTitle>
                <AlertDescription>
                  Secret values will be exported as <code>***ENCRYPTED***</code> placeholders for security.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
