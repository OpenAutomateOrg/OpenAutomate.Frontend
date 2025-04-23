import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Footer } from '@/components/layout/footer'

export default function Home() {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-orange-600">
            Open Source Automation is here.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-10">
            OpenAutomate provides a Python-based, open-source alternative to commercial automation
            platforms. Take control of your automation processes without licensing costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 transition-all duration-300 hover:translate-y-[-2px]"
              >
                Try OpenAutomate Free
              </Button>
            </Link>
            <Link href="/docs">
              <Button
                variant="outline"
                size="lg"
                className="text-orange-600 border-orange-600 hover:bg-orange-600/10 transition-all duration-300 hover:translate-y-[-2px]"
              >
                Explore the platform
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 text-orange-600">
            The workflows of tomorrow start here
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-orange-600/10 flex items-center justify-center mb-4">
                  <Icons.check className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>No Vendor Lock-in</CardTitle>
                <CardDescription>
                  Full control over your automation assets and infrastructure with no proprietary
                  technologies.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-orange-600/10 flex items-center justify-center mb-4">
                  <Icons.billing className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Cost Effective</CardTitle>
                <CardDescription>
                  Eliminate licensing costs while maintaining enterprise-grade automation
                  capabilities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-orange-600/10 flex items-center justify-center mb-4">
                  <Icons.fileText className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Python-based</CardTitle>
                <CardDescription>
                  Leverage the power and flexibility of Python and its extensive library ecosystem.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 bg-muted">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 text-orange-600">
            Solutions for every industry
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            <Button
              variant="outline"
              className="py-6 h-auto flex flex-col gap-2 hover:bg-orange-600/10 hover:text-orange-600 hover:border-orange-600 transition-all"
            >
              <Icons.user className="h-6 w-6" />
              <span>Healthcare</span>
            </Button>

            <Button
              variant="outline"
              className="py-6 h-auto flex flex-col gap-2 hover:bg-orange-600/10 hover:text-orange-600 hover:border-orange-600 transition-all"
            >
              <Icons.billing className="h-6 w-6" />
              <span>Finance</span>
            </Button>

            <Button
              variant="outline"
              className="py-6 h-auto flex flex-col gap-2 hover:bg-orange-600/10 hover:text-orange-600 hover:border-orange-600 transition-all"
            >
              <Icons.check className="h-6 w-6" />
              <span>Insurance</span>
            </Button>

            <Button
              variant="outline"
              className="py-6 h-auto flex flex-col gap-2 hover:bg-orange-600/10 hover:text-orange-600 hover:border-orange-600 transition-all"
            >
              <Icons.home className="h-6 w-6" />
              <span>Public Sector</span>
            </Button>

            <Button
              variant="outline"
              className="py-6 h-auto flex flex-col gap-2 hover:bg-orange-600/10 hover:text-orange-600 hover:border-orange-600 transition-all"
            >
              <Icons.settings className="h-6 w-6" />
              <span>Manufacturing</span>
            </Button>

            <Button
              variant="outline"
              className="py-6 h-auto flex flex-col gap-2 hover:bg-orange-600/10 hover:text-orange-600 hover:border-orange-600 transition-all"
            >
              <Icons.file className="h-6 w-6" />
              <span>Retail</span>
            </Button>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4">
                    Focus on core business, not automation infrastructure
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Eliminate repetitive, rules-based tasks and liberate your team&apos;s time for
                    strategic initiatives. OpenAutomate provides an end-to-end platform for
                    automation that&apos;s easy to deploy and manage.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Icons.check className="h-5 w-5 text-orange-600" />
                      <span>Reduction in automation platform costs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Icons.check className="h-5 w-5 text-orange-600" />
                      <span>Decreased time to deploy new processes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Icons.check className="h-5 w-5 text-orange-600" />
                      <span>Increased control over automation assets</span>
                    </li>
                  </ul>
                  <Link href="/about" className="mt-6 inline-block">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 hover:translate-y-[-2px]">
                      Learn more
                    </Button>
                  </Link>
                </div>
                <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Dashboard Preview</p>
                    <div className="bg-background border border-input p-4 rounded inline-block">
                      <Icons.chart className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 text-orange-600">
            The proof is in the performance
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <Icons.help className="h-6 w-6 text-orange-600" />
                </div>
                <p className="italic text-muted-foreground mb-4">
                  &ldquo;OpenAutomate has allowed us to save over 120 hours per month on repetitive
                  tasks while giving us full control over our automation infrastructure.&rdquo;
                </p>
                <div>
                  <p className="font-semibold">Alex Chen</p>
                  <p className="text-sm text-muted-foreground">
                    IT Director, Healthcare Solutions Inc.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <Icons.help className="h-6 w-6 text-orange-600" />
                </div>
                <p className="italic text-muted-foreground mb-4">
                  &ldquo;Switching to OpenAutomate reduced our automation costs by 70% while giving
                  our team the flexibility to customize processes to our exact needs.&rdquo;
                </p>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">CTO, Finance Partners</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <Icons.help className="h-6 w-6 text-orange-600" />
                </div>
                <p className="italic text-muted-foreground mb-4">
                  &ldquo;The Python foundation of OpenAutomate means we can leverage our existing
                  skills and libraries. We&apos;ve cut development time in half.&rdquo;
                </p>
                <div>
                  <p className="font-semibold">Marcus Rivera</p>
                  <p className="text-sm text-muted-foreground">Automation Lead, TechInnovate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-600/10 text-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6 text-orange-600">
            Ready to take control of your automation?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join organizations that have broken free from vendor lock-in and reduced costs while
            gaining more control over their automation processes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="bg-orange-600 hover:bg-orange-700 transition-all duration-300 hover:translate-y-[-2px]"
              >
                Try OpenAutomate Free
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-orange-600 border-orange-600 hover:bg-orange-600/10 transition-all duration-300 hover:translate-y-[-2px]"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  )
}
