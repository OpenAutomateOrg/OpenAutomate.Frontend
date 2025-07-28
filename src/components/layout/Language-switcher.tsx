'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { useLocale, Locale } from '@/providers/locale-provider'

// Define available languages
const languages = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hover:border-orange-600 gap-2 px-2 sm:px-4 py-1 sm:py-2 min-w-0"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden xs:inline-block sm:inline-block text-xs sm:text-base">
            {languages.find((lang) => lang.code === locale)?.name || 'Language'}{' '}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px] w-32 sm:w-40" sideOffset={4}>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLocale(language.code as Locale)}
            className={(language.code === locale ? 'font-bold ' : '') + 'text-xs sm:text-base'}
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
