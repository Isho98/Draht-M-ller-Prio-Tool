export type AppArea = {
  id: string
  label: string
  href: string
  available: boolean
}

/** Registry for start-screen areas. Add entries here to extend the product. */
export const APP_AREAS: AppArea[] = [
  {
    id: 'feinplanung',
    label: 'Feinplanung',
    href: '/feinplanung',
    available: true,
  },
]

export function getAvailableAreas() {
  return APP_AREAS.filter((area) => area.available)
}
