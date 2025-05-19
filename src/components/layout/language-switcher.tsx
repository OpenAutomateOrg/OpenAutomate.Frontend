'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'

const languages = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'VietNam' },
]

export function LanguageSwitcher() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()

  // Lấy ngôn ngữ hiện tại từ route params hoặc localStorage
  let currentLang = (params?.lang as string) || 'en'
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('lang')
    if (savedLang && languages.some((l) => l.code === savedLang)) {
      currentLang = savedLang
    }
  }

  // Khi mount, nếu có ngôn ngữ đã lưu mà khác với route thì chuyển route
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang')
      if (savedLang && savedLang !== currentLang) {
        router.replace(getPathWithNewLocale(savedLang))
      }
    }
    // eslint-disable-next-line
  }, [])

  const getPathWithNewLocale = (locale: string) => {
    const segments = pathname.split('/')
    const idx = 1
    while (languages.some((lang) => lang.code === segments[idx])) {
      segments.splice(idx, 1)
    }
    segments.splice(1, 0, locale)
    return segments.join('/')
  }

  // Khi chọn ngôn ngữ, lưu vào localStorage
  const handleSelectLanguage = (lang: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hover:border-orange-600 gap-2">
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
              onClick={() => handleSelectLanguage(language.code)}
            >
              {language.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
