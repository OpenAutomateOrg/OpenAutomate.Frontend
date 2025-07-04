import { NextResponse } from 'next/server'

/**
 * Discovery endpoint for Bot Agents to find the backend API URL
 * This allows agents to connect directly to the backend while only needing
 * to know the public-facing frontend URL
 */
export async function GET() {
  try {
    // Get the backend API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl) {
      console.error('NEXT_PUBLIC_API_URL environment variable is not set')
      return NextResponse.json(
        { error: 'Backend API URL not configured' },
        { status: 500 }
      )
    }

    // Return the API URL for agent discovery
    return NextResponse.json({
      apiUrl: apiUrl,
    })
  } catch (error) {
    console.error('Error in connection-info endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
