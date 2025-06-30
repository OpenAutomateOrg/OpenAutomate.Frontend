'use client'

import { User } from '@/types/auth'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/providers/auth-provider'
import { useRouter } from 'next/navigation'

interface SystemAdminUserNavProps {
  user: User | null
}

export function SystemAdminUserNav({ user }: SystemAdminUserNavProps) {
  const { logout } = useAuth()
  const router = useRouter()

  if (!user) return null

  // Get initials for the avatar
  const getInitials = () => {
    if (!user) return '??'
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if logout fails, redirect to login
      router.push('/login')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt={user.firstName} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <p className="text-xs leading-none text-orange-600 font-medium">System Administrator</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/system-admin')} className="cursor-pointer">
            <Icons.home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push('/system-admin/settings')}
            className="cursor-pointer"
          >
            <Icons.settings className="mr-2 h-4 w-4" />
            <span>System Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
          <Icons.logout className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
