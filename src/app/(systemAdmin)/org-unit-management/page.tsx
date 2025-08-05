import OrganizationUnitAdminInterface from '@/components/systemAdmin/organization-unit/organization-unit'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Organization Units',
  description: 'Organization unit management page',
}

export default function organizationUnitPage() {
  return <OrganizationUnitAdminInterface />
}
