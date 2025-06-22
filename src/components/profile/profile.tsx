'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Save, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'

// Mock user data based on your database schema
const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  login: 'johndoe',
  imageUrl: '/placeholder.svg?height=120&width=120',
  createdAt: '2024-01-15T10:30:00Z',
  lastModifyAt: '2024-12-01T14:22:00Z',
}

export default function Profile() {
  // const [user, setUser] = useState(mockUser)
  const [isEditing, setIsEditing] = useState(false)
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    systemRole: user?.systemRole,
    // login: user?.login,
    // imageUrl: user?.imageUrl,
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = () => {
    // In a real app, this would make an API call to update the user
    // setUser((prev) => ({
    //   ...prev,
    //   ...formData,
    //   lastModifyAt: new Date().toISOString(),
    // }))
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      systemRole: user?.systemRole,
      // login: user.login,
      // imageUrl: user.imageUrl,
    })
    setIsEditing(false)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your personal information and account settings
            </p>
          </div>
        </div>

        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile photo</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center space-x-4 justify-between">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt="Profile picture" />
                <AvatarFallback className="text-lg"></AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isEditing && (
              <div className="flex-1 space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="Enter image URL"
                />
              </div>
            )}
            {/* System Role Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">System Role</Label>
              <div className="flex items-center gap-2">
                {user?.systemRole === 0 ? (
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
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
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

            {/* <div className="space-y-2">
              <Label htmlFor="login">Username</Label>
              {isEditing ? (
                <Input
                  id="login"
                  value={formData.login}
                  onChange={(e) => handleInputChange('login', e.target.value)}
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">@{user.login}</div>
              )}
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
