import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { RegisterClient } from './client'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Register | OpenAutomate',
  description: 'Create a new account on OpenAutomate',
}

export default function RegisterPage() {
  return (
    <>
      <Header />
      <div className="container flex-1 flex items-center justify-center py-12">
        <Suspense>
          <RegisterClient />
        </Suspense>
      </div>
    </>
  )
}
