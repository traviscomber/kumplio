export const PUBLIC_LOCALES = ['es', 'en'] as const

export type PublicLocale = (typeof PUBLIC_LOCALES)[number]

export const DEFAULT_PUBLIC_LOCALE: PublicLocale = 'es'
export const PUBLIC_LOCALE_COOKIE = 'kumplio_public_locale'
export const LOCALE_REQUEST_HEADER = 'x-kumplio-locale'
export const PUBLIC_PATH_REQUEST_HEADER = 'x-kumplio-public-path'

const PUBLIC_EXACT_PATHS = new Set([
  '/',
  '/software-cumplimiento-chile',
  '/features/ley-21719',
  '/resources/ley-21719',
  '/resources/cumplimiento-normativo',
  '/use-cases',
  '/pricing',
  '/enterprise',
  '/demo',
  '/faq',
  '/about',
  '/como-pensamos',
  '/powered-by-n3uralia',
  '/contact',
  '/security',
  '/privacy',
  '/terms',
])

const PUBLIC_PREFIX_PATHS = [
  '/resources/ley-21719/',
  '/resources/cumplimiento-normativo/',
  '/features/',
  '/use-cases/',
  '/demo/',
]

// Locale migration is route-by-route. A path enters one of these sets only after
// its copy, links, metadata, claims and discovery behavior have been reviewed.
const SPANISH_PUBLIC_PATHS_READY = new Set([
  '/',
  '/pricing',
  '/demo',
  '/faq',
  '/contact',
  '/about',
  '/como-pensamos',
  '/powered-by-n3uralia',
  '/security',
  '/privacy',
  '/terms',
])
const ENGLISH_PUBLIC_PATHS_READY = new Set([
  '/',
  '/pricing',
  '/demo',
  '/faq',
  '/contact',
  '/about',
  '/como-pensamos',
  '/powered-by-n3uralia',
  '/security',
  '/privacy',
  '/terms',
])

const INFRASTRUCTURE_EXACT_PATHS = new Set([
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/llms-full.txt',
  '/kumplio.json',
  '/feed.xml',
  '/indexnow-key.txt',
])

export function isPublicLocale(value: string | null | undefined): value is PublicLocale {
  return value === 'es' || value === 'en'
}

export function splitPublicLocale(pathname: string): { locale: PublicLocale; pathname: string } | null {
  const match = pathname.match(/^\/(es|en)(?:\/|$)/)
  if (!match || !isPublicLocale(match[1])) return null

  const locale = match[1]
  const withoutLocale = pathname.slice(locale.length + 1)

  return {
    locale,
    pathname: withoutLocale ? (withoutLocale.startsWith('/') ? withoutLocale : `/${withoutLocale}`) : '/',
  }
}

export function isPublicSitePath(pathname: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true
  return PUBLIC_PREFIX_PATHS.some((prefix) => pathname.startsWith(prefix))
}

export function isLocalizedPublicPathReady(pathname: string, locale: PublicLocale) {
  return locale === 'en'
    ? ENGLISH_PUBLIC_PATHS_READY.has(pathname)
    : SPANISH_PUBLIC_PATHS_READY.has(pathname)
}

export function isEnglishPublicPathReady(pathname: string) {
  return ENGLISH_PUBLIC_PATHS_READY.has(pathname)
}

export function withPublicLocale(pathname: string, locale: PublicLocale) {
  if (pathname === '/') return `/${locale}`
  return `/${locale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

export function getPublicSiteHref(pathname: string, locale: PublicLocale) {
  return isLocalizedPublicPathReady(pathname, locale)
    ? withPublicLocale(pathname, locale)
    : pathname
}

export function getStoredPublicLocale(value: string | undefined): PublicLocale {
  return isPublicLocale(value) ? value : DEFAULT_PUBLIC_LOCALE
}

export function isInfrastructurePath(pathname: string) {
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/.well-known/')) return true
  if (INFRASTRUCTURE_EXACT_PATHS.has(pathname)) return true

  // Public files and generated assets must keep stable, unprefixed URLs.
  return /\.[a-z0-9]{2,8}$/i.test(pathname)
}
