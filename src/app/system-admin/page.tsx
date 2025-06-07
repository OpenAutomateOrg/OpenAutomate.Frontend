'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  Users,
  Building2,
  Bot,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

// Mock data for dashboard
const stats = [
  {
    title: 'Total Users',
    value: '2,847',
    change: '+12.5%',
    changeType: 'positive',
    icon: Users,
  },
  {
    title: 'Organizations',
    value: '156',
    change: '+3.2%',
    changeType: 'positive',
    icon: Building2,
  },
  {
    title: 'Active Agents',
    value: '1,234',
    change: '+8.1%',
    changeType: 'positive',
    icon: Bot,
  },
  {
    title: 'System Health',
    value: '98.5%',
    change: '+0.3%',
    changeType: 'positive',
    icon: Activity,
  },
]

const recentActivities = [
  {
    id: 1,
    type: 'user_added',
    message: 'New user registered: john.doe@company.com',
    time: '2 minutes ago',
    status: 'success',
  },
  {
    id: 2,
    type: 'org_created',
    message: 'Organization "TechCorp Ltd" was created',
    time: '15 minutes ago',
    status: 'success',
  },
  {
    id: 3,
    type: 'agent_offline',
    message: 'Agent "Agent-001" went offline',
    time: '1 hour ago',
    status: 'warning',
  },
  {
    id: 4,
    type: 'system_update',
    message: 'System maintenance completed successfully',
    time: '3 hours ago',
    status: 'success',
  },
]

export default function SystemAdminHome() {
  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            System Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor and manage your entire system from here.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'}
                    >
                      {stat.change}
                    </span>{' '}
                    from last month
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
          {/* Chart Section */}
          <Card className="lg:col-span-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <TrendingUp className="h-5 w-5" />
                System Overview
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                User registrations and system activity over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {/* Placeholder for chart */}
              <div className="h-[250px] md:h-[300px] flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg border-2 border-dashed border-primary/30">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                  <p className="text-sm text-primary font-medium">Chart Component</p>
                  <p className="text-xs text-primary/80">Integration with Chart.js or similar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-4 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
              <CardDescription className="text-muted-foreground">
                Latest system activities and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {activity.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none text-card-foreground truncate">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Link href="/system-admin/user-management">
                <div className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200">
                  <Users className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-medium">Manage Users</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      Add, edit, or remove users
                    </p>
                  </div>
                </div>
              </Link>
              <Link href="/system-admin/org-unit-management">
                <div className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200">
                  <Building2 className="h-8 w-8 text-chart-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-medium">Organization Units</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      Configure organization structure
                    </p>
                  </div>
                </div>
              </Link>
              <Link href="/system-admin/agent-management">
                <div className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200">
                  <Bot className="h-8 w-8 text-chart-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-medium">Agent Management</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      Monitor and control agents
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
