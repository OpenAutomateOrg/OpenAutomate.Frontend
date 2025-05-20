import type { NextApiRequest, NextApiResponse } from 'next'

type DiscoveryResponse = {
  apiUrl: string
}

/**
 * API Discovery endpoint
 * Returns the backend API URL for the bot agent to connect to directly
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiscoveryResponse>
) {
  // Get the API URL from environment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5252'
  
  // Return the API URL
  res.status(200).json({ apiUrl })
} 