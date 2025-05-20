import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

/**
 * Handles email verification by redirecting to the backend API
 * This acts as a proxy for email verification links
 */
export async function GET(request: NextRequest) {
  try {
    // Get the token from the query parameters
    const token = request.nextUrl.searchParams?.get('token')

    if (!token) {
      // If no token is provided, redirect to the error page
      return NextResponse.redirect(
        `${new URL(config.paths.auth.emailVerified, request.nextUrl.origin)}?success=false&reason=missing-token`,
      )
    }

    // Construct the backend API URL
    const backendUrl = `${config.api.baseUrl}/api/email/verify?token=${token}`

    // Make the request to the backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'manual', // Don't automatically follow redirects
    })

    // The backend sends a 302 redirect with the frontend URL in the Location header
    // Extract the redirect URL from the Location header
    const redirectUrl = response.headers.get('location')

    if (redirectUrl) {
      // If we got a redirect URL from the backend, use it
      return NextResponse.redirect(redirectUrl)
    } else {
      // If no redirect URL was provided, redirect to the default success page
      return NextResponse.redirect(
        `${new URL(config.paths.auth.emailVerified, request.nextUrl.origin)}?success=true`,
      )
    }
  } catch (error) {
    console.error('Error during email verification:', error)
    // In case of error, redirect to the error page
    return NextResponse.redirect(
      `${new URL(config.paths.auth.emailVerified, request.nextUrl.origin)}?success=false&reason=server-error`,
    )
  }
}
