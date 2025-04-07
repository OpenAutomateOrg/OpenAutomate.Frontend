import { Metadata } from "next"
import Link from "next/link"
import { RegisterForm } from "@/components/forms/register-form"
import { Header } from "@/components/layout/header"

export const metadata: Metadata = {
  title: "Register | OpenAutomate",
  description: "Create a new account on OpenAutomate",
}

export default function RegisterPage() {
  return (
    <>
      <Header />
      <div className="container flex-1 flex items-center justify-center py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your details to create your account
            </p>
          </div>
          <RegisterForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-primary font-medium transition-all duration-300 hover:underline-offset-8"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  )
} 