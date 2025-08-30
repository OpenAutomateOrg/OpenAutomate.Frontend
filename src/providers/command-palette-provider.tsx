'use client'

import { createContext, useContext } from 'react'
import { CommandPalette } from '@/components/command-palette/command-palette'
import { useCommandPalette } from '@/hooks/use-command-palette'

interface CommandPaletteContextType {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  openPalette: () => void
  closePalette: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined)

export function useCommandPaletteContext() {
  const context = useContext(CommandPaletteContext)
  if (context === undefined) {
    throw new Error('useCommandPaletteContext must be used within a CommandPaletteProvider')
  }
  return context
}

interface CommandPaletteProviderProps {
  children: React.ReactNode
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const commandPalette = useCommandPalette()

  return (
    <CommandPaletteContext.Provider value={commandPalette}>
      {children}
      <CommandPalette 
        open={commandPalette.open} 
        onOpenChange={commandPalette.setOpen} 
      />
    </CommandPaletteContext.Provider>
  )
}
