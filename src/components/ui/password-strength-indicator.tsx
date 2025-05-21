'use client'

import React from 'react'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  // Calculate password strength
  const calculateStrength = (password: string): number => {
    if (!password) return 0

    let strength = 0
    
    // Points for length
    if (password.length >= 8) strength += 1
    if (password.length >= 12) strength += 1
    
    // Points for different character types
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    
    return Math.min(strength, 5) // Maximum 5 points
  }

  const strength = calculateStrength(password)
  
  // Labels for each strength level
  const getStrengthLabel = (strength: number): string => {
    switch (strength) {
      case 0: return 'Very weak'
      case 1: return 'Weak'
      case 2: return 'Medium'
      case 3: return 'Good'
      case 4: return 'Strong'
      case 5: return 'Very strong'
      default: return ''
    }
  }
  
  // Colors for each strength level
  const getStrengthColor = (strength: number): string => {
    switch (strength) {
      case 0: return 'bg-gray-200'
      case 1: return 'bg-red-500'
      case 2: return 'bg-orange-500'
      case 3: return 'bg-yellow-500'
      case 4: return 'bg-blue-500'
      case 5: return 'bg-green-500'
      default: return 'bg-gray-200'
    }
  }
  
  // Create strength bar visualization
  const renderStrengthBars = () => {
    const bars = []
    for (let i = 0; i < 5; i++) {
      bars.push(
        <div
          key={i}
          className={`h-1.5 w-full rounded-sm transition-colors ${
            i < strength ? getStrengthColor(strength) : 'bg-gray-200'
          }`}
        />
      )
    }
    return (
      <div className="grid grid-cols-5 gap-1">{bars}</div>
    )
  }

  return (
    <div className="mt-1 w-full">
      {renderStrengthBars()}
      <div className="mt-1 text-xs text-gray-500 text-right">
        {password && getStrengthLabel(strength)}
      </div>
    </div>
  )
} 