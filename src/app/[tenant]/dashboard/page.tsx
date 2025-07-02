'use client'

import { SectionCards } from '@/components/layout/section-cards'
import { ChartPieLabel } from '@/components/layout/charts/chart-pie-label'
import { StatisticalStatus } from '@/components/layout/statistical-status'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'
import { useSidebar } from '@/components/ui/sidebar'
import { useToast } from '@/components/ui/use-toast'

export default function DashBoard() {
  const dashboardRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const { open } = useSidebar()
  const exportToPDF = async () => {
    if (open) {
      toast({ variant: 'default', title: 'Error', description: 'Sidebar need close to export' })
    } else {
      if (!dashboardRef.current) return

      try {
        // Show loading state
        const exportButton = document.querySelector('[data-export-button]')
        if (exportButton) {
          exportButton.textContent = 'Exporting...'
          ;(exportButton as HTMLButtonElement).disabled = true
        }

        // Create canvas from the dashboard content
        const canvas = await html2canvas(dashboardRef.current, {
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: dashboardRef.current.scrollWidth,
          height: dashboardRef.current.scrollHeight,
        })

        // Calculate dimensions for PDF
        const imgWidth = 210 // A4 width in mm
        const pageHeight = 295 // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4')
        let position = 0

        // Add title
        pdf.setFontSize(20)
        pdf.text('Dashboard Report', 20, 20)
        pdf.setFontSize(12)
        pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)

        // Add the dashboard image
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', 0, 40, imgWidth, imgHeight)
        heightLeft -= pageHeight

        // Add new pages if content is too long
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        // Save the PDF
        pdf.save(`dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Error generating PDF. Please try again.')
      } finally {
        // Reset button state
        const exportButton = document.querySelector('[data-export-button]')
        if (exportButton) {
          exportButton.textContent = 'Export PDF'
          ;(exportButton as HTMLButtonElement).disabled = false
        }
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-muted/20 min-h-screen">
      {/* Export Button */}
      <div className="flex justify-end p-2 sm:p-4 lg:p-6">
        <Button onClick={exportToPDF} data-export-button className="flex items-center gap-2">
          <Download size={16} />
          Export PDF
        </Button>
      </div>

      {/* Dashboard Content */}
      <div
        ref={dashboardRef}
        className="@container/main flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6 dark:bg-black/60"
      >
        {/* Section Cards */}
        <div className="rounded-xl">
          <SectionCards />
        </div>
        {/* Pie Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 rounded-xl h-auto md:h-[575px]">
          <div className="flex flex-col gap-2 min-w-0">
            <StatisticalStatus />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <ChartPieLabel />
          </div>
        </div>
      </div>
    </div>
  )
}
