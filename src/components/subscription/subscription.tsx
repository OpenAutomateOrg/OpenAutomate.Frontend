'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, Crown, Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { subscriptionApi } from '@/lib/api/subscription'
import { useToast } from '@/components/ui/use-toast'

const plans = [
  {
    name: 'Premium',
    icon: Crown,
    price: '$29',
    period: 'per month',
    description: 'Perfect for growing businesses and teams',
    popular: true,
    features: [
      'Up to 50 team members',
      '100GB storage',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'API access',
      'Advanced security',
      'Mobile app access',
    ],
  },
  {
    name: 'Enterprise',
    icon: Building2,
    price: '$99',
    period: 'per month',
    description: 'For large organizations with advanced needs',
    popular: false,
    features: [
      'Unlimited team members',
      '1TB storage',
      'Advanced analytics & reporting',
      '24/7 dedicated support',
      'Custom integrations & SSO',
      'Full API access',
      'Enterprise-grade security',
      'White-label solutions',
      'Custom onboarding',
      'SLA guarantee',
    ],
  },
]

export default function SubscriptionPage() {
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const getCurrentTenant = (): string => {
    if (typeof window === 'undefined') return ''
    const path = window.location.pathname
    const segments = path.split('/').filter(Boolean)
    return segments.length > 0 ? segments[0] : ''
  }

  const handlePlanSelect = async (planName: string) => {
    try {
      setSelectedPlan(planName)
      setIsProcessing(true)

      toast({
        title: 'Redirecting to payment...',
        description: 'Please wait while we prepare your checkout.',
      })

      const redirectUrl = `${window.location.origin}${window.location.pathname}`
      const checkoutUrl = await subscriptionApi.getCheckoutUrl({
        redirectUrl,
      })
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Failed to get checkout URL:', error)
      toast({
        title: 'Error',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
      setSelectedPlan(null)
    }
  }

  const handleBack = () => {
    const tenant = getCurrentTenant()
    router.push(`/${tenant}/dashboard`)
  }

  const handleSkip = () => {
    if (dontShowAgain) {
      // TODO: Save preference to not show subscription page again
      localStorage.setItem('skipSubscriptionModal', 'true')
    }
    const tenant = getCurrentTenant()
    router.push(`/${tenant}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-sm text-gray-500">Step 2 of 3</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your business needs and start your journey with us today
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {plans.map((plan) => {
              const IconComponent = plan.icon
              const isSelected = selectedPlan === plan.name
              const isLoading = isProcessing && isSelected

              return (
                <Card
                  key={plan.name}
                  className={`relative ${plan.popular ? 'ring-2 ring-orange-500 shadow-lg' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 hover:bg-orange-600">
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      <div
                        className={`p-3 rounded-full ${plan.popular ? 'bg-orange-100' : 'bg-gray-100'}`}
                      >
                        <IconComponent
                          className={`h-6 w-6 ${plan.popular ? 'text-orange-600' : 'text-gray-600'}`}
                        />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      size="lg"
                      onClick={() => handlePlanSelect(plan.name)}
                      disabled={isProcessing}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Get Started with ${plan.name}`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-2 justify-center">
              <Checkbox
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label htmlFor="dont-show" className="text-sm text-muted-foreground cursor-pointer">
                Do not show this again
              </label>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>All plans include a 14-day free trial. No credit card required.</p>
              <p className="mt-2">
                Cancel anytime. Questions?{' '}
                <span className="text-orange-600 cursor-pointer hover:underline">
                  Contact our sales team
                </span>
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="lg"
                className="text-gray-600 hover:text-gray-800 bg-transparent"
                onClick={handleSkip}
                disabled={isProcessing}
              >
                Skip for now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
