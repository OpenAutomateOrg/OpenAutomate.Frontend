'use client' // Error boundaries must be Client Components

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    // global-error must include html and body tags
    <html>
      <body className="min-h-screen flex items-center justify-center bg-orange-50 text-orange-800 font-sans p-4">
        <div className="max-w-md w-full bg-white shadow-md rounded-xl p-6 border border-orange-200">
          <h2 className="text-2xl font-semibold text-orange-600 mb-2">Something went wrong!</h2>
          <p className="mb-4">{error.message}</p>
          <div className="flex ">
            <button
              onClick={reset}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded w-full"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
