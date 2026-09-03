import path from 'path'

/** Writable data directory. On Vercel the app filesystem is read-only; /tmp is allowed. */
export function getDataDir(): string {
  if (process.env.VERCEL) return '/tmp/adept-data'
  return path.join(process.cwd(), 'data')
}
