import { getDemoContext } from '@/lib/db/store'
import { getAreas } from '@/lib/db/repositories/areas'
import { apiSuccess, withErrorHandling } from '@/lib/api/server'

export const GET = withErrorHandling(async () => {
  getDemoContext()
  const areas = await getAreas()
  return apiSuccess({ areas })
})
