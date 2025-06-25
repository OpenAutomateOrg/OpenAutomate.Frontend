import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardContent className="pt-8 pb-8">
          <div className="mb-6">
            <div className="text-6xl font-bold text-gray-300 mb-2">404</div>
            <div className="w-24 h-1 bg-orange-600 mx-auto rounded-full"></div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">Not Found</h1>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Sorry, we could not find the page you are looking for. It might have been moved,
            deleted, or you entered the wrong URL.
          </p>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>

              <Button asChild className="flex-1 bg-orange-600 hover:bg-orange-700">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
