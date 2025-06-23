import { Info } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function StatisticalStatus() {
  const jobStatuses = [
    { label: 'Running', count: 0 },
    { label: 'Pending', count: 0 },
    { label: 'Stopping', count: 0 },
    { label: 'Terminating', count: 0 },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-orange-600/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card ">
      <Card className="flex flex-col  h-full flex-1">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center justify-between text-lg font-medium">
            Jobs Status
            <Info className="w-5 h-5 " />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0  h-full">
          <div className="grid grid-cols-2 gap-4">
            {jobStatuses.map((status) => (
              <Card key={status.label} className="">
                <CardContent className="p-1 flex flex-col items-center justify-center ">
                  <div className=" px-4 py-2 rounded-full border mb-4">
                    <span className="text-sm font-medium ">{status.label}</span>
                  </div>
                  <div className="text-4xl font-ligh">{status.count}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
