import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  DEFAULT_PUBLIC_LOCALE,
  getStoredPublicLocale,
  isInfrastructurePath,
  isLocalizedPublicPathReady,
  isPublicSitePath,
  LOCALE_REQUEST_HEADER,
  PUBLIC_LOCALE_COOKIE,
  PUBLIC_PATH_REQUEST_HEADER,
  splitPublicLocale,
  withPublicLocale,
} from '@/lib/i18n/public-routing'
import { updateSession } from '@/lib/supabase/proxy'

const ONE_YEAR = 60 * 60 * 24 * 365
const AUTHENTICATED_PATH_HEADER = 'x-kumplio-authenticated-path'

function copySessionCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie)
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (isInfrastructurePath(pathname)) {
    return updateSession(request)
  }

  if (pathname.startsWith('/app')) {
    const forwardedHeaders = new Headers(request.headers)
    forwardedHeaders.set(
      AUTHENTICATED_PATH_HEADER,
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    )
    return updateSession(request, forwardedHeaders)
  }

  const localized = splitPublicLocale(pathname)

  if (localized) {
    // Locale migration is explicit per route. Requests for a prefixed route that is
    // not ready yet are sent back to the current canonical unprefixed page.
    if (!isPublicSitePath(localized.pathname) || !isLocalizedPublicPathReady(localized.pathname, localized.locale)) {
      const unprefixedUrl = request.nextUrl.clone()
      unprefixedUrl.pathname = localized.pathname
      return NextResponse.redirect(unprefixedUrl, 308)
    }

    // Refresh Supabase first so a token rotation is reflected in the request cookies
    // that are forwarded through the rewrite.
    const sessionResponse = await updateSession(request)
    const forwardedHeaders = new Headers(request.headers)
    forwardedHeaders.set(LOCALE_REQUEST_HEADER, localized.locale)
    forwardedHeaders.set(PUBLIC_PATH_REQUEST_HEADER, localized.pathname)

    const internalUrl = request.nextUrl.clone()
    internalUrl.pathname = localized.pathname

    const response = NextResponse.rewrite(internalUrl, {
      request: { headers: forwardedHeaders },
    })

    copySessionCookies(sessionResponse, response)
    response.cookies.set(PUBLIC_LOCALE_COOKIE, localized.locale, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ONE_YEAR,
    })
    response.headers.set('Content-Language', localized.locale === 'es' ? 'es-CL' : 'en')

    return response
  }

  if (isPublicSitePath(pathname)) {
    const locale = getStoredPublicLocale(request.cookies.get(PUBLIC_LOCALE_COOKIE)?.value) || DEFAULT_PUBLIC_LOCALE

    if (isLocalizedPublicPathReady(pathname, locale)) {
      const localizedUrl = request.nextUrl.clone()
      localizedUrl.pathname = withPublicLocale(pathname, locale)
      return NextResponse.redirect(localizedUrl, 308)
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
