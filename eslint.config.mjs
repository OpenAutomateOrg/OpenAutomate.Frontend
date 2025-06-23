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
      // Strict TypeScript rules - catch critical issues early
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for gradual improvement
      '@typescript-eslint/no-non-null-assertion': 'warn', // Warn for now, can be upgraded later
      '@typescript-eslint/ban-ts-comment': 'error',

      // React rules - strict enforcement for critical issues
      'react-hooks/exhaustive-deps': 'error',
      'react/no-unescaped-entities': 'error',

      // General code quality - focus on critical issues
      'no-console': 'warn', // Keep as warn since it's common in development
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-expressions': 'warn', // Warn instead of error

      // Import/export rules - warn for now
      'no-duplicate-imports': 'warn',

      // Potential bug catchers - warn for gradual improvement
      'no-implicit-coercion': 'warn',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
    }
  }
]

export default eslintConfig
