'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function CsvTemplateHelper() {
  const { toast } = useToast()

  const downloadTemplate = () => {
    const csvContent = `Key,Value,Description,Type,BotAgentNames
example_api_key,your_api_key_value,API key for external service,String,Agent1
db_password,secure_password123,Database connection password,Secret,"Agent1,Agent2"
config_url,https://api.example.com,Configuration URL,String,
smtp_server,mail.example.com,,String,
basic_key,simple_value,,String,
encryption_key,my_secret_key_123,Encryption key for data,Secret,TestAgent
empty_description_asset,test_value,,Secret,
`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', 'assets_template.csv')
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: 'Template Downloaded',
      description: 'CSV template has been downloaded to help you format your data correctly',
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={downloadTemplate}
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
    >
      <Download className="h-3 w-3" />
      Download Template
    </Button>
  )
}
