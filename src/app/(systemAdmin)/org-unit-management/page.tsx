import OrganizationUnitAdminInterface from '@/components/systemAdmin/organizationUnit/organization-unit'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Organization Units',
  description: 'Organization unit management page',
}

export default function organizationUnitPage() {
  return <OrganizationUnitAdminInterface />
}
