import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, User, Tag, Server, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// In a real app, this would fetch data from an API
const getTaskById = (id: string) => {
  // Sample data
  return {
    id,
    action: 'Process Data',
    workflow: 'Data Pipeline',
    version: '1.0.2',
    agent: 'Data Processor',
    agentGroup: 'Processing',
    state: 'Completed',
    startTime: '2023-04-15T10:30:00',
    endTime: '2023-04-15T10:35:00',
    source: 'API',
    command: 'process --all',
    schedules: 'Daily',
    taskId: 'T-12345',
    createdDate: '2023-04-15T10:29:00',
    createdBy: 'System',
    logs: [
      { timestamp: '2023-04-15T10:30:00', level: 'INFO', message: 'Task started' },
      { timestamp: '2023-04-15T10:32:00', level: 'INFO', message: 'Processing data batch 1/3' },
      { timestamp: '2023-04-15T10:33:00', level: 'INFO', message: 'Processing data batch 2/3' },
      { timestamp: '2023-04-15T10:34:00', level: 'INFO', message: 'Processing data batch 3/3' },
      { timestamp: '2023-04-15T10:35:00', level: 'INFO', message: 'Task completed successfully' },
    ],
  }
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const task = getTaskById(params.id)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Task Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Rerun Task</Button>
          <Button variant="destructive">Cancel Task</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Task Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Action</p>
                <p>{task.action}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Workflow</p>
                <p>{task.workflow}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Version</p>
                <p>{task.version}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Agent</p>
                <p>{task.agent}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Agent Group</p>
                <p>{task.agentGroup}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">State</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.state === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : task.state === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : task.state === 'Running'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {task.state}
                  </span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Task ID</p>
                <p>{task.taskId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Command</p>
                <p className="font-mono text-sm bg-muted p-1 rounded">{task.command}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Source</p>
                <p>{task.source}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Schedules</p>
                <p>{task.schedules}</p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Start Time</p>
                  <p className="text-sm text-muted-foreground">
                    {task.startTime ? new Date(task.startTime).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">End Time</p>
                  <p className="text-sm text-muted-foreground">
                    {task.endTime ? new Date(task.endTime).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(task.createdDate).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created By</p>
                  <p className="text-sm text-muted-foreground">{task.createdBy}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Task Type</p>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Environment</p>
                  <p className="text-sm text-muted-foreground">Production</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Runtime</p>
                  <p className="text-sm text-muted-foreground">Node.js 18</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-white p-4 rounded-md font-mono text-sm h-64 overflow-y-auto">
            {task.logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-400">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>{' '}
                <span
                  className={`${
                    log.level === 'ERROR'
                      ? 'text-red-400'
                      : log.level === 'WARN'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                  }`}
                >
                  {log.level}
                </span>{' '}
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
