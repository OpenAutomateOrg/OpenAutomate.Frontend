import AssetInterface from '@/components/asset/asset'
import { PermissionRouteGuard } from '@/components/auth/permission-route-guard'
import { Skeleton } from '@/components/ui/skeleton'
import { PermissionLevel } from '@/types/auth'

export default function Page() {
  return (
    <PermissionRouteGuard 
      resource="AssetResource" 
      requiredPermission={PermissionLevel.View}
      loadingComponent={
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      }
    >
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        <AssetInterface />
      </div>
    </PermissionRouteGuard>
  )
}
