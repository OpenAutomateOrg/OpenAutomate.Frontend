import OrganizationUnitAdminInterface from '@/components/system-admin/organizationUnit/organizationUnit'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Organization Units',
  description: 'Organization unit management page',
}

export default function organizationUnitPage() {
  return <OrganizationUnitAdminInterface />
}
