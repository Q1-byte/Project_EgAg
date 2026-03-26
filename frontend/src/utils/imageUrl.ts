const EC2_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? ''

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${EC2_BASE}${url}`
}
