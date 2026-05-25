export const WONINGKENMERKEN_OPTIONS = [
  'Energiezuinig',
  'Recent gerenoveerd',
  'Instapklaar',
  'Luxe afwerking',
  'Investeringspand',
  'Rustig gelegen',
  'Kindvriendelijk',
  'Dichtbij openbaar vervoer',
]

export function getWoningkenmerken(property: any): string[] {
  return Array.isArray(property?.woningkenmerken)
    ? property.woningkenmerken.filter((item: unknown): item is string => typeof item === 'string' && Boolean(item.trim()))
    : []
}

export function toggleWoningkenmerk(current: string[], value: string) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
}
