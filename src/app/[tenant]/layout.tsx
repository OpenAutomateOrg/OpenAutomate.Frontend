import { AppSidebar } from '@/components/layout/sidebar/app-sidebar'
import { SiteHeader } from '@/components/layout/sidebar/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SearchProvider } from '@/components/layout/search/search-context'
import { TenantGuard } from '@/components/auth/tenant-guard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantGuard>
      <div className=" [--header-height:calc(theme(spacing.14))] dark:bg-black/60">
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar />
            <SidebarInset>
              <SearchProvider>
                <main className="">{children}</main>
              </SearchProvider>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </TenantGuard>
  )
}
