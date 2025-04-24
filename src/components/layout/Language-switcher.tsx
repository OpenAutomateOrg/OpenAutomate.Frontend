'use client'

import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'

// Define available languages
const languages = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'VietNam' },
]

export function LanguageSwitcher() {
  const params = useParams()
  const pathname = usePathname()

  // Get current language from route params
  const currentLang = (params?.lang as string) || 'en'

  // Function to get the new path with changed language
  const getPathWithNewLocale = (locale: string) => {
    // If the current path already has a locale, replace it
    if (params?.lang) {
      return pathname.replace(`/${currentLang}`, `/${locale}`)
    }
    // Otherwise, add the locale to the beginning of the path
    return `/${locale}${pathname}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {languages.find((lang) => lang.code === currentLang)?.name || 'Language'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem key={language.code} asChild>
            <Link
              href={getPathWithNewLocale(language.code)}
              className={language.code === currentLang ? 'font-bold' : ''}
            >
              {language.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
