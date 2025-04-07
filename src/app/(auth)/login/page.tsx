import { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/forms/login-form"
import { Header } from "@/components/layout/header"

export const metadata: Metadata = {
  title: "Login | OpenAutomate",
  description: "Login to your OpenAutomate account",
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <div className="container flex-1 flex items-center justify-center py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign In
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to continue
            </p>
          </div>
          <LoginForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="underline underline-offset-4 hover:text-primary font-medium transition-all duration-300 hover:underline-offset-8"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  )
} 