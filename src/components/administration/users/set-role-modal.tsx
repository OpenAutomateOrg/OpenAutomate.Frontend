import React, { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import useSWR, { mutate as globalMutate } from 'swr'
import { useToast } from '@/components/ui/use-toast'
import { rolesApi, RoleWithPermissionsDto, RoleDto } from '@/lib/api/roles'
import { organizationUnitUserApi } from '@/lib/api/organization-unit-user'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SetRoleModalProps {
    readonly isOpen: boolean
    readonly onClose: () => void
    readonly userId: string
    readonly email: string
    readonly refreshUsersList?: () => void
}

export default function SetRoleModal({ isOpen, onClose, userId, email, refreshUsersList }: SetRoleModalProps) {
    const { toast } = useToast()
    // Fetch all roles in the organization unit using SWR
    const { data: allRoles, isLoading } = useSWR<RoleWithPermissionsDto[]>('roles', rolesApi.getAllRoles)
    // Fetch roles currently assigned to the user using SWR
    const { data: userRoles, isLoading: isUserRolesLoading } = useSWR<RoleDto[]>(
        isOpen ? `user-roles-${userId}` : null,
        () => rolesApi.getUserAuthorities(userId)
    )

    // State for the currently selected role in the dropdown
    const [selectedRoleId, setSelectedRoleId] = useState<string>('')
    // State for the list of roles added to the table
    const [addedRoles, setAddedRoles] = useState<RoleDto[]>([])
    const [saving, setSaving] = useState<boolean>(false)

    // Initialize addedRoles from userRoles when modal opens
    React.useEffect(() => {
        if (isOpen) {
            if (userRoles && Array.isArray(userRoles)) {
                setAddedRoles(userRoles)
            } else {
                setAddedRoles([])
            }
        }
    }, [isOpen, userRoles])

    // Compute available roles for select (exclude already added)
    const availableRoles = useMemo((): RoleWithPermissionsDto[] => {
        if (!allRoles) return []
        return allRoles.filter((r: RoleWithPermissionsDto) => !addedRoles.some((ar: RoleDto) => ar.id === r.id))
    }, [allRoles, addedRoles])

    // Add selected role to the table
    const handleAddRole = (): void => {
        if (!selectedRoleId) return
        const role = allRoles?.find((r: RoleWithPermissionsDto) => r.id === selectedRoleId)
        if (role && !addedRoles.some((ar: RoleDto) => ar.id === role.id)) {
            setAddedRoles((prev: RoleDto[]) => [...prev, role])
            setSelectedRoleId('')
        }
    }

    // Remove a role from the table
    const handleRemoveRole = (roleId: string): void => {
        setAddedRoles((prev: RoleDto[]) => prev.filter((r: RoleDto) => r.id !== roleId))
    }

    // Save roles (send list of role IDs to backend)
    const handleSave = async (): Promise<void> => {
        setSaving(true)
        try {
            await organizationUnitUserApi.assignRolesBulk(userId, addedRoles.map((r: RoleDto) => r.id))
            toast({ title: 'Success', description: 'Roles updated successfully.' })
            setAddedRoles([])
            if (refreshUsersList) {
                refreshUsersList()
            } else {
                globalMutate((key) => Array.isArray(key) && key[0] === 'organization-unit-users')
            }
            onClose()
        } catch (err) {
            /// Show error toast to user, do not rethrow because error is already handled for UX.
            // Log error for debugging and SonarQube compliance
            console.error('Failed to update roles:', err)
            toast({ title: 'Error', description: 'Failed to update roles.', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Set Roles for {email}</DialogTitle>
                </DialogHeader>
                {/* Select dropdown and Add button */}
                <div className="flex gap-2 items-end mb-4">
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select a role to add" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableRoles.map((role: RoleWithPermissionsDto) => (
                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAddRole} disabled={!selectedRoleId || isLoading || isUserRolesLoading} type="button">
                        Add
                    </Button>
                </div>
                {/* Table of added roles, scrollable if too tall */}
                <div className="w-full max-w-[650px] max-h-[50vh] overflow-y-auto overflow-x-auto">
                    <Table className="min-w-full table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3 text-left max-w-[300px] truncate">Role Name</TableHead>
                                <TableHead className="w-1/3 text-left max-w-[200px] truncate">Description</TableHead>
                                <TableHead className="w-1/3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isUserRolesLoading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">Loading...</TableCell>
                                </TableRow>
                            )}
                            {!isUserRolesLoading && addedRoles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">No roles added</TableCell>
                                </TableRow>
                            )}
                            {!isUserRolesLoading && addedRoles.length > 0 && (
                                <>
                                    {addedRoles.map((role: RoleDto) => (
                                        <TableRow key={role.id}>
                                            <TableCell className="w-1/3 text-left max-w-[300px] truncate">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="truncate cursor-pointer">{role.name}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{role.name}</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell className="w-1/3 text-left max-w-[200px] truncate">
                                                {role.description ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="truncate cursor-pointer">{role.description}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{role.description}</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="w-1/3 text-right">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleRemoveRole(role.id)}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || isLoading || isUserRolesLoading} type="button">
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 