import { Metadata } from 'next'
import { LoginClient } from './client'

export const metadata: Metadata = {
  title: 'Login | OpenAutomate',
  description: 'Login to your OpenAutomate account',
}

export default function LoginPage() {
  return (
    <>
      <div className="container flex-1 flex items-center justify-center py-12">
        <LoginClient />
      </div>
    </>
  )
}
