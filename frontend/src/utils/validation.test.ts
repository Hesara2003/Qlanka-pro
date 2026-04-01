import { describe, expect, it } from 'vitest'
import {
  getPasswordStrength,
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validatePasswordLogin,
  validatePasswordStrict,
  validateUsername,
} from './validation'

describe('validation utils', () => {
  it('validates email values', () => {
    expect(validateEmail('')).toBe('Email is required.')
    expect(validateEmail('bad-email')).toBe('Enter a valid email address (e.g. user@example.com).')
    expect(validateEmail('user@example.com')).toBeUndefined()
  })

  it('validates strict password rules', () => {
    expect(validatePasswordStrict('')).toBe('Password is required.')
    expect(validatePasswordStrict('Aa1@a')).toBe(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    )
    expect(validatePasswordStrict('aaaaaaaa')).toBe(
      'Password must include uppercase, lowercase, digit and special character (@$!%*?&).',
    )
    expect(validatePasswordStrict('GoodPass1@')).toBeUndefined()
  })

  it('validates login password rules', () => {
    expect(validatePasswordLogin('')).toBe('Password is required.')
    expect(validatePasswordLogin('short')).toBe(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    )
    expect(validatePasswordLogin('longenough')).toBeUndefined()
  })

  it('computes password strength labels', () => {
    expect(getPasswordStrength('')).toEqual({ score: 0, label: '', color: 'transparent' })
    expect(getPasswordStrength('aaaaaaaa')).toEqual({ score: 2, label: 'Weak', color: '#f97316' })
    expect(getPasswordStrength('aaaaaaaaA')).toEqual({ score: 3, label: 'Fair', color: '#eab308' })
    expect(getPasswordStrength('Aaaaaaaa1')).toEqual({ score: 4, label: 'Strong', color: '#22c55e' })
    expect(getPasswordStrength('Aaaaaaaa1@')).toEqual({ score: 5, label: 'Very strong', color: '#16a34a' })
  })

  it('validates usernames', () => {
    expect(validateUsername('')).toBe('Username is required.')
    expect(validateUsername('ab')).toBe('Username must be at least 3 characters.')
    expect(validateUsername('valid_user')).toBeUndefined()
  })
})
