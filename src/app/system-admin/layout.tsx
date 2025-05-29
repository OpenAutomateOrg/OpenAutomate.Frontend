import { SystemAdminSidebar } from '@/components/system-admin/system-admin-sidebar'
import { SystemAdminHeader } from '@/components/system-admin/system-admin-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SystemAdminHeader />
        <div className="flex flex-1">
          <SystemAdminSidebar />
          <SidebarInset>
            <main className="">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
