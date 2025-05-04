'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { cn } from '@/lib/utils'

interface TabsProps extends React.ComponentProps<typeof TabsPrimitive.Root> {
  // If true, will sync tab state with URL search params
  useUrlParams?: boolean;
  // The param name to use in the URL (defaults to 'tab')
  paramName?: string;
}

// Inner component that uses search params - must be wrapped in Suspense by consumers
function TabsWithParams({ 
  className, 
  useUrlParams = false,
  paramName = 'tab',
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  ...props 
}: TabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Handle URL parameter sync if enabled
  const handleValueChange = React.useCallback((newValue: string) => {
    if (controlledOnValueChange) {
      controlledOnValueChange(newValue)
    }
    
    if (useUrlParams) {
      // Create new URLSearchParams with current params
      const params = new URLSearchParams(searchParams.toString())
      
      // Update the tab parameter
      params.set(paramName, newValue)
      
      // Update URL without refreshing the page
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [controlledOnValueChange, useUrlParams, paramName, router, pathname, searchParams])
  
  // Get value from URL if enabled
  const urlValue = useUrlParams ? (searchParams.get(paramName) || undefined) : undefined
  const value = urlValue || controlledValue
  
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      value={value}
      onValueChange={handleValueChange}
      {...props}
    />
  )
}

// Standard Tabs component without params for when URL sync is not needed
function TabsNoParams({ 
  className, 
  ...props 
}: TabsProps) {
  // This version doesn't use search params, for when useUrlParams is false
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

// Export a single Tabs component that handles both cases
function Tabs(props: TabsProps) {
  // If URL params are not needed, use the simpler version
  if (!props.useUrlParams) {
    return <TabsNoParams {...props} />
  }
  
  // If URL params are needed, the component must be wrapped in Suspense by the consumer
  return <TabsWithParams {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
