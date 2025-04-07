"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"

export function DashboardStats() {
  // Example stats data (in a real app, this would come from an API)
  const stats = [
    {
      title: "Active Automations",
      value: "24",
      icon: <Icons.play className="h-4 w-4 text-muted-foreground" />,
      change: "+12.5%",
      changeType: "positive"
    },
    {
      title: "Total Workflows",
      value: "42",
      icon: <Icons.fileText className="h-4 w-4 text-muted-foreground" />,
      change: "+8.2%",
      changeType: "positive"
    },
    {
      title: "Success Rate",
      value: "98.5%",
      icon: <Icons.check className="h-4 w-4 text-muted-foreground" />,
      change: "+2.3%",
      changeType: "positive"
    },
    {
      title: "Error Rate",
      value: "1.5%",
      icon: <Icons.warning className="h-4 w-4 text-muted-foreground" />,
      change: "-0.8%",
      changeType: "positive"
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs ${
              stat.changeType === "positive" 
                ? "text-green-500" 
                : "text-red-500"
            }`}>
              {stat.change} from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 