"use client"

import { formatDate } from "@/lib/utils"
import { Icons } from "@/components/ui/icons"

type ActivityStatus = "completed" | "processing" | "failed"

interface ActivityItem {
  id: string
  name: string
  status: ActivityStatus
  timestamp: Date
  type: string
}

export function RecentActivity() {
  // Example data for recent activities (in a real app, this would come from an API)
  const activities: ActivityItem[] = [
    {
      id: "act-1",
      name: "Data Export Automation",
      status: "completed",
      timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
      type: "automation"
    },
    {
      id: "act-2",
      name: "Email Notification Workflow",
      status: "processing",
      timestamp: new Date(Date.now() - 1000 * 60 * 40), // 40 minutes ago
      type: "workflow"
    },
    {
      id: "act-3",
      name: "Report Generation",
      status: "failed",
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      type: "report"
    },
    {
      id: "act-4",
      name: "Data Import Automation",
      status: "completed",
      timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
      type: "automation"
    },
    {
      id: "act-5",
      name: "User Sync Workflow",
      status: "completed",
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      type: "workflow"
    }
  ]

  // Status icon mapping
  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case "completed":
        return <Icons.check className="h-4 w-4 text-green-500" />
      case "processing":
        return <Icons.refresh className="h-4 w-4 text-blue-500 animate-spin" />
      case "failed":
        return <Icons.warning className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }
  
  // Type icon mapping
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "automation":
        return <Icons.play className="h-4 w-4 text-muted-foreground" />
      case "workflow":
        return <Icons.fileText className="h-4 w-4 text-muted-foreground" />
      case "report":
        return <Icons.chart className="h-4 w-4 text-muted-foreground" />
      default:
        return <Icons.file className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-8">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center">
          <div className="flex-shrink-0 mr-4 space-y-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              {getTypeIcon(activity.type)}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">{activity.name}</p>
              <div className="flex items-center">
                {getStatusIcon(activity.status)}
                <span className="text-xs text-muted-foreground ml-2 capitalize">
                  {activity.status}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
} 