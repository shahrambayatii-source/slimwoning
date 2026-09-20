import { describe, expect, it } from 'vitest'

import {
  CANONICAL_ACCESSIBILITY_TAGS,
  CANONICAL_FEATURE_TAGS,
  CANONICAL_OUTDOOR_TAGS,
  normalizeBooleanValue,
  normalizeCity,
  normalizeEpcLabel,
  normalizePropertyType,
  normalizeTagArray,
} from './property-normalizers'

describe('property-normalizers', () => {
  it('normalizes city aliases, casing and whitespace', () => {
    expect(normalizeCity('  bruxelles ')).toBe('Brussel')
    expect(normalizeCity('BRUSSELS')).toBe('Brussel')
    expect(normalizeCity('LIÈGE')).toBe('Liège')
    expect(normalizeCity('  oud   heverlee ')).toBe('Oud Heverlee')
    expect(normalizeCity('sint-niklaas')).toBe('Sint-niklaas')
    expect(normalizeCity(null)).toBe('')
    expect(normalizeCity(undefined)).toBe('')
  })

  it('normalizes tags against allowed values with aliases and deduplication', () => {
    expect(
      normalizeTagArray(['garden', 'Tuin', ' balkon ', '', null], CANONICAL_OUTDOOR_TAGS)
    ).toEqual(['Tuin', 'Balkon'])
    expect(normalizeTagArray('elevator', CANONICAL_ACCESSIBILITY_TAGS)).toEqual(['Lift aanwezig'])
    expect(normalizeTagArray(['zonnepanelen'], CANONICAL_FEATURE_TAGS)).toEqual(['Zonnepanelen'])
    expect(normalizePropertyType('huis en appartement')).toBe('Huis en appartement')
  })

  it('maps boolean and EPC label boundaries', () => {
    expect(normalizeBooleanValue(true)).toBe(true)
    expect(normalizeBooleanValue('Ja')).toBe(true)
    expect(normalizeBooleanValue(1)).toBe(true)
    expect(normalizeBooleanValue(' NIET   aanwezig ')).toBe(false)
    expect(normalizeBooleanValue(0)).toBe(false)
    expect(normalizeBooleanValue('')).toBeNull()
    expect(normalizeBooleanValue(null)).toBeNull()
    expect(normalizeBooleanValue('misschien')).toBeNull()
    expect(normalizeEpcLabel(' a+ ')).toBe('A+')
    expect(normalizeEpcLabel('z')).toBe('Z')
    expect(normalizeEpcLabel(null)).toBe('')
  })
})
