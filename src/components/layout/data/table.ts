import type { Task } from '@/types/table'

const tasks: Task[] = [
  {
    id: 'task-1',
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
  },
  {
    id: 'task-2',
    action: 'Generate Report',
    workflow: 'Reporting',
    version: '2.1.0',
    agent: 'Report Generator',
    agentGroup: 'Reporting',
    state: 'Pending',
    startTime: null,
    endTime: null,
    source: 'Scheduler',
    command: 'generate-report --monthly',
    schedules: 'Monthly',
    taskId: 'T-12346',
    createdDate: '2023-04-16T09:00:00',
    createdBy: 'Admin',
  },
]

// Export all tabs data
export const taskTable: Task[] = tasks
