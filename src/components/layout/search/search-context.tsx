'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface SearchContextType {
  searchTerm: string
  setSearchTerm: (term: string) => void
  isSearching: boolean
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('')

  const value: SearchContextType = {
    searchTerm,
    setSearchTerm,
    isSearching: searchTerm.length > 0,
  }

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearchContext() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider')
  }
  return context
}
