'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, User, LoaderCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'
import { ChangePasswordCard } from '../auth/change-password-card'
import { authApi } from '@/lib/api/auth'
import { useToast } from '@/components/ui/use-toast'

export default function Profile() {
  // const [user, setUser] = useState(mockUser)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    systemRole: user?.systemRole,
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!user?.id || !formData.firstName || !formData.lastName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'default',
      })
      return
    }

    setIsLoading(true)
    try {
      await authApi.changeUserName(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      // Update user data in context immediately
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })

      setIsEditing(false)
    } catch (error) {
      let errorMessage = 'Failed to update profile'
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        (error as { status: number }).status === 403
      ) {
        errorMessage = 'You do not have permission to perform this action'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      systemRole: user?.systemRole,
    })
    setIsEditing(false)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleSave} size="sm" disabled={isLoading}>
                  {isLoading ? (
                    <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md">{user?.firstName}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md">{user?.lastName}</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{user?.email}</div>
              )}
            </div>
            {/* System Role Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">System Role</Label>
              <div className="flex items-center gap-2">
                {user?.systemRole === 0 || user?.systemRole === "User" ? (
                  <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
                    {/* User Icon Placeholder */}
                    User
                  </Badge>
                ) : (
                  <Badge
                    variant="default"
                    className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <ChangePasswordCard />
      </div>
    </div>
  )
}
