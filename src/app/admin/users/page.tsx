'use client'

import { useState } from 'react'
import { AdminRouteGuard } from '@/components/auth/admin-route-guard'
import { useSystemRoles } from '@/hooks/useSystemRoles'
import { SystemRole } from '@/types/auth'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function AdminUsersPage() {
  // Track users with pending role changes
  const [pendingChanges, setPendingChanges] = useState<Record<string, SystemRole>>({})
  
  // Use the system roles hook with both user types fetched
  const {
    adminUsers,
    standardUsers,
    loadingAdmins,
    loadingStandardUsers,
    adminError,
    standardUserError,
    setUserRole,
    changingRole,
    changeRoleError,
    refreshUsers
  } = useSystemRoles({
    fetchAdmins: true,
    fetchStandardUsers: true
  })
  
  // Helper to handle role change selection
  const handleRoleChange = (userId: string, role: string) => {
    setPendingChanges({
      ...pendingChanges,
      [userId]: role === 'admin' ? SystemRole.Admin : SystemRole.User
    })
  }
  
  // Helper to apply a role change
  const applyRoleChange = async (userId: string) => {
    if (!pendingChanges[userId]) return
    
    const success = await setUserRole(userId, pendingChanges[userId])
    
    if (success) {
      // Clear the pending change after successful update
      setPendingChanges(current => {
        const updated = { ...current }
        delete updated[userId]
        return updated
      })
    }
  }
  
  return (
    <AdminRouteGuard>
      <div className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User System Roles</h1>
          <Button 
            variant="outline" 
            onClick={refreshUsers}
            disabled={loadingAdmins || loadingStandardUsers}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loadingAdmins || loadingStandardUsers) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {changeRoleError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{changeRoleError}</AlertDescription>
          </Alert>
        )}
        
        {/* Admin Users Section */}
        <Card>
          <CardHeader>
            <CardTitle>System Administrators</CardTitle>
            <CardDescription>
              Users with full access to system-wide functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{adminError}</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAdmins ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                          Loading administrators...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : adminUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No administrators found
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue="admin"
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="user">Standard User</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {pendingChanges[user.id] !== undefined && (
                            <Button 
                              onClick={() => applyRoleChange(user.id)}
                              disabled={changingRole}
                              size="sm"
                            >
                              {changingRole ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Apply Change
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Standard Users Section */}
        <Card>
          <CardHeader>
            <CardTitle>Standard Users</CardTitle>
            <CardDescription>
              Users with access limited to their assigned tenant and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {standardUserError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{standardUserError}</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingStandardUsers ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : standardUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No standard users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    standardUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue="user"
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="user">Standard User</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {pendingChanges[user.id] !== undefined && (
                            <Button 
                              onClick={() => applyRoleChange(user.id)}
                              disabled={changingRole}
                              size="sm"
                            >
                              {changingRole ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Apply Change
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRouteGuard>
  )
} 