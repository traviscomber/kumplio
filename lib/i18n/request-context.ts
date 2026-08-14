import { headers } from 'next/headers'
import {
  DEFAULT_PUBLIC_LOCALE,
  isPublicLocale,
  isPublicSitePath,
  LOCALE_REQUEST_HEADER,
  PUBLIC_PATH_REQUEST_HEADER,
  type PublicLocale,
} from '@/lib/i18n/public-routing'

export type PublicRequestContext = {
  locale: PublicLocale
  pathname: string | null
}

export async function getPublicRequestContext(): Promise<PublicRequestContext> {
  const requestHeaders = await headers()
  const rawLocale = requestHeaders.get(LOCALE_REQUEST_HEADER)
  const rawPathname = requestHeaders.get(PUBLIC_PATH_REQUEST_HEADER)

  return {
    locale: isPublicLocale(rawLocale) ? rawLocale : DEFAULT_PUBLIC_LOCALE,
    pathname: rawPathname && isPublicSitePath(rawPathname) ? rawPathname : null,
  }
}
