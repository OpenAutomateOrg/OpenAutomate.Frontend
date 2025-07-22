'use client';

import * as React from 'react';
import { ChangeEvent, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { organizationUnitApi } from '@/lib/api/organization-units';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import useSWR from 'swr';
import { swrKeys } from '@/lib/swr-config';

interface OrganizationUnit {
  id: string;
  name: string;
  description: string;
}

export default function OrganizationUnitProfile() {
  const params = useParams();
  const slug = params.tenant as string | undefined;
  const [organizationUnitId, setOrganizationUnitId] = useState<string | null>(null);
  const [organizationUnit, setOrganizationUnit] = useState<OrganizationUnit | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [showNameChangeWarning, setShowNameChangeWarning] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const { toast } = useToast();
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) {
      setOrganizationUnitId(null);
      return;
    }
    organizationUnitApi
      .getBySlug(slug)
      .then((ou) => {
        setOrganizationUnitId(ou.id);
      })
      .catch(() => {
        setOrganizationUnitId(null);
      });
  }, [slug]);

  useEffect(() => {
    if (!organizationUnitId) return;
    organizationUnitApi
      .getById(organizationUnitId)
      .then((ou) => {
        setOrganizationUnit(ou);
        setEditedName(ou.name);
        setEditedDescription(ou.description);
      })
      .catch(() => {
        setOrganizationUnit(null);
      });
  }, [organizationUnitId]);

  const handleEdit = () => {
    if (!organizationUnit) return;
    setEditedName(organizationUnit.name);
    setEditedDescription(organizationUnit.description);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedName.trim()) {
      toast({
        title: 'Error',
        description: 'Organization unit name cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    if (!organizationUnitId) return;
    if (organizationUnit && editedName.trim() !== organizationUnit.name) {
      setShowNameChangeWarning(true);
      return;
    }
    setIsSaving(true);
    try {
      const updated = await organizationUnitApi.update(organizationUnitId, {
        name: editedName,
        description: editedDescription,
      });
      setOrganizationUnit(updated);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Organization unit information updated successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Update failed',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptNameChange = async () => {
    if (!organizationUnitId) {
      toast({
        title: 'Error',
        description: 'Organization unit ID is missing. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    setPendingSave(true);
    try {
      const updated = await organizationUnitApi.update(organizationUnitId, {
        name: editedName,
        description: editedDescription,
      });
      setOrganizationUnit(updated);
      setIsEditing(false);
      setShowNameChangeWarning(false);
      toast({
        title: 'Success',
        description: 'Organization unit information updated successfully',
      });
      window.location.href = '/tenant-selector';
    } catch {
      toast({
        title: 'Error',
        description: 'Update failed',
        variant: 'destructive',
      });
    } finally {
      setPendingSave(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!organizationUnitId) return;
    setShowDeleteConfirmation(false);
    try {
      await organizationUnitApi.requestDeletion(organizationUnitId);

      // Update status immediately and then every second
      const checkStatus = async () => {
        const status = await organizationUnitApi.getDeletionStatus(organizationUnitId);
        console.log('Checking status:', status);
        await mutateDeletionStatus();

        const response = status as any;
        if (!response.isPendingDeletion) {
          setTimeout(checkStatus, 1000);
        }
      };

      // Start checking status
      checkStatus();

      toast({
        title: 'Deletion Requested',
        description: 'Organization unit deletion has been initiated.',
      });
    } catch (error: unknown) {
      let message = 'Failed to request deletion.';
      if (error instanceof Error) {
        message = error.message;
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleCancelDeletion = async () => {
    if (!organizationUnitId) return;
    try {
      await organizationUnitApi.cancelDeletion(organizationUnitId);
      mutateDeletionStatus();
      toast({
        title: 'Deletion Cancelled',
        description: 'Organization unit deletion has been cancelled.',
      });
    } catch (error: unknown) {
      let message = 'Failed to cancel deletion.';
      if (error instanceof Error) {
        message = error.message;
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  // Fetch deletion status from API
  const fetchDeletionStatus = async (): Promise<{
    isPendingDeletion: boolean;
    remainingSeconds: number | null;
    scheduledDeletionAt: string | null;
  }> => {
    if (!organizationUnitId) throw new Error('Missing ID');
    const result = await organizationUnitApi.getDeletionStatus(organizationUnitId);
    console.log('API Response:', result); // Log for debugging

    const now = new Date();
    const scheduledTime = result.scheduledDeletionAt ? new Date(result.scheduledDeletionAt) : null;
    const diffSeconds = scheduledTime
      ? Math.max(0, Math.floor((scheduledTime.getTime() - now.getTime()) / 1000))
      : null;

    // Log for debugging
    console.log('API Response:', result);

    const response = result as any; // Type assertion to access API keys

    return {
      isPendingDeletion: response.isPendingDeletion,
      remainingSeconds: diffSeconds,
      scheduledDeletionAt: response.scheduledDeletionAt,
    };
  };

  // SWR hook for automatic status refetching
  const { data: deletionStatusData, mutate: mutateDeletionStatus } = useSWR(
    organizationUnitId ? swrKeys.organizationUnitDeletionStatus(organizationUnitId) : null,
    fetchDeletionStatus,
    {
      refreshInterval: 1000, // Auto refresh every second
      refreshWhenHidden: true, // Continue refreshing when tab is hidden
    }
  );

  // Update countdown based on remainingSeconds
  useEffect(() => {
    if (!deletionStatusData?.isPendingDeletion) {
      setCountdown(null);
      return;
    }

    // Update countdown from remainingSeconds
    setCountdown(deletionStatusData.remainingSeconds || 0);

    // Update countdown every second
    const interval = setInterval(() => {
      setCountdown(current => {
        if (current === null || current <= 0) return 0;
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [deletionStatusData?.isPendingDeletion, deletionStatusData?.remainingSeconds]);

  const showDeletionStatus = Boolean(deletionStatusData?.isPendingDeletion);

  // Format remaining time
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Deleting...';

    // If time is less than or equal to 1 minute, show total seconds
    if (seconds <= 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);

    return parts.join(', ');
  };

  return (
    <div className="flex justify-center pt-8">
      <div className="w-full max-w-2xl">
        <div className="bg-background rounded-2xl shadow border border-border px-8 py-7">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold">Organization Unit Information</h2>
              <div className="text-sm text-muted-foreground">Details of your organization unit</div>
            </div>
            {!isEditing && !showDeletionStatus && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-gray-300 hover:border-[#FF6A1A] hover:bg-[#FFF3EC] rounded-lg font-medium"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
            {!isEditing && !showDeletionStatus && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-red-300 hover:border-red-500 hover:bg-red-50 rounded-lg font-medium text-red-600"
                onClick={handleDelete}
              >
                Delete Organization Unit
              </Button>
            )}
          </div>

          {showDeletionStatus && (
            <div className="flex items-center justify-between dark:bg-orange-950/50 bg-orange-50 border border-orange-300 dark:border-orange-800/50 rounded-lg px-4 py-3 my-4">
              <div className="text-orange-700 dark:text-orange-400 font-semibold">
                {(typeof countdown === 'number' && countdown > 0)
                  ? `This organization unit will be deleted in ${formatTimeRemaining(countdown)}`
                  : 'Deleting organization unit...'}
              </div>
              <Button
                variant="outline"
                className="ml-4 border-orange-600 text-orange-700 hover:bg-orange-100"
                onClick={handleCancelDeletion}
              >
                Cancel Deletion
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Name</label>
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditedName(e.target.value)}
                  className="rounded-lg border-input bg-background focus:border-[#FF6A1A] focus:ring-[#FF6A1A]/30"
                  placeholder="Organization unit name"
                />
              ) : (
                <div className="rounded-lg bg-muted px-3 py-2 text-base border border-border">{organizationUnit?.name}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
              {isEditing ? (
                <Input
                  value={editedDescription}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditedDescription(e.target.value)}
                  className="rounded-lg border-input bg-background focus:border-[#FF6A1A] focus:ring-[#FF6A1A]/30"
                  placeholder="Organization unit description"
                />
              ) : (
                <div className="rounded-lg bg-muted px-3 py-2 text-base border border-border">
                  {organizationUnit?.description || <span className="italic text-muted-foreground">No description</span>}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 mt-8">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="rounded-lg">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-[#FF6A1A] text-white hover:bg-orange-500"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        <Dialog open={showNameChangeWarning} onOpenChange={setShowNameChangeWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Warning</DialogTitle>
            </DialogHeader>
            <div>
              If you change the name, the tenant will also change, which will result in a changed URL and the Bot agent will be disconnected. Do you still want to proceed?
            </div>
            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNameChangeWarning(false)} disabled={pendingSave}>
                Cancel
              </Button>
              <Button
                onClick={handleAcceptNameChange}
                disabled={pendingSave}
                className="bg-[#FF6A1A] text-white hover:bg-orange-500"
              >
                Accept
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div>
              Are you sure you want to delete this organization unit? It will be deleted in 7 days.
            </div>
            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmDelete} className="bg-red-600 text-white hover:bg-red-700">
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>
    </div>
  );
}
