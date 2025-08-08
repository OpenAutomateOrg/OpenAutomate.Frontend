import UserManagementPage from '@/components/systemAdmin/user-management/user-management'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'User Management',
  description: 'User management page',
}

export default function userManagementPage() {
  return <UserManagementPage />
}
