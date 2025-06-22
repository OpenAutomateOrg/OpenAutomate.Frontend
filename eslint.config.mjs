import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Reasonable TypeScript rules - catch real issues but not overly strict
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React rules - focus on real issues
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'warn',

      // General code quality
      'no-console': 'warn',
      'prefer-const': 'warn',

      // Disable overly strict rules
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
    }
  }
]

export default eslintConfig
