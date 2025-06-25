'use client'

import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PermissionLevel } from '@/types/auth'

/**
 * Example component demonstrating conditional UI rendering based on user permissions
 * 
 * This shows how to use the hasPermission helper within components to:
 * - Show/hide UI elements based on permissions
 * - Display different content for different permission levels
 * - Handle cases where profile is still loading
 */
export function PermissionExample() {
  const { userProfile, hasPermission, isSystemAdmin, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading permissions...</div>
  }

  if (!userProfile && !isSystemAdmin) {
    return <div>Profile not loaded</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Permission System Example</CardTitle>
          <CardDescription>
            This demonstrates conditional rendering based on user permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System admin gets everything */}
          {isSystemAdmin && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="font-semibold text-red-800">System Administrator</p>
              <p className="text-red-600">You have full access to everything</p>
            </div>
          )}

          {/* Asset Management Section */}
          <div className="space-y-2">
            <h3 className="font-semibold">Asset Management</h3>
            
            {hasPermission('AssetResource', PermissionLevel.View) ? (
              <div className="space-x-2">
                <Button variant="outline" size="sm">View Assets</Button>
                
                {hasPermission('AssetResource', PermissionLevel.Create) && (
                  <Button variant="outline" size="sm">Create Asset</Button>
                )}
                
                {hasPermission('AssetResource', PermissionLevel.Update) && (
                  <Button variant="outline" size="sm">Edit Assets</Button>
                )}
                
                {hasPermission('AssetResource', PermissionLevel.Delete) && (
                  <Button variant="destructive" size="sm">Delete Assets</Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No access to asset management</p>
            )}
          </div>

          {/* Bot Agent Section */}
          <div className="space-y-2">
            <h3 className="font-semibold">Bot Agent Management</h3>
            
            {hasPermission('AgentResource', PermissionLevel.View) ? (
              <div className="space-x-2">
                <Button variant="outline" size="sm">View Agents</Button>
                
                {hasPermission('AgentResource', PermissionLevel.Create) && (
                  <Button variant="outline" size="sm">Create Agent</Button>
                )}
                
                {hasPermission('AgentResource', PermissionLevel.Update) && (
                  <Button variant="outline" size="sm">Edit Agents</Button>
                )}
                
                {hasPermission('AgentResource', PermissionLevel.Delete) && (
                  <Button variant="destructive" size="sm">Delete Agents</Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No access to agent management</p>
            )}
          </div>

          {/* Organization Unit Management */}
          <div className="space-y-2">
            <h3 className="font-semibold">Organization Management</h3>
            
            {hasPermission('OrganizationUnitResource', PermissionLevel.View) ? (
              <div className="space-x-2">
                <Button variant="outline" size="sm">View Settings</Button>
                
                {hasPermission('OrganizationUnitResource', PermissionLevel.Update) && (
                  <Button variant="outline" size="sm">Manage Users</Button>
                )}
                
                {hasPermission('OrganizationUnitResource', PermissionLevel.Delete) && (
                  <Button variant="destructive" size="sm">Admin Functions</Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No access to organization management</p>
            )}
          </div>

          {/* Debug Information */}
          <details className="mt-6">
            <summary className="cursor-pointer font-semibold">Debug: Current Permissions</summary>
            <div className="mt-2 p-4 bg-gray-50 rounded text-sm">
              <pre>{JSON.stringify(userProfile?.organizationUnits, null, 2)}</pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
} 