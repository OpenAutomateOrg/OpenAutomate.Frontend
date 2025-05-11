import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'
import { taskSchema } from '@/components/data/schema'

export async function GET() {
  const data = await fs.readFile(
    path.join(process.cwd(), 'app/(app)/examples/tasks/data/tasks.json'),
  )
  const tasks = JSON.parse(data.toString())
  const parsed = z.array(taskSchema).parse(tasks)

  return NextResponse.json(parsed)
}
