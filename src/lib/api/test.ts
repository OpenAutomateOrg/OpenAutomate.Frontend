import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
// import { taskSchema } from '@/components/data/schema' // Commented out - schema not found

export async function GET() {
  const data = await fs.readFile(
    path.join(process.cwd(), 'app/(app)/examples/tasks/data/tasks.json'),
  )
  const tasks = JSON.parse(data.toString())
  // const parsed = z.array(taskSchema).parse(tasks) // Commented out - schema not found
  const parsed = tasks

  return NextResponse.json(parsed)
}
