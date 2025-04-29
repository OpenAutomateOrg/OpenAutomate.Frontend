export interface Task {
  id: string
  action: string
  workflow: string
  version: string
  agent: string
  agentGroup: string
  state: 'Pending' | 'Running' | 'Completed' | 'Failed'
  startTime: string | null
  endTime: string | null
  source: string
  command: string
  schedules: string
  taskId: string
  createdDate: string
  createdBy: string
  logs?: TaskLog[]
}

export interface TaskLog {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
}
