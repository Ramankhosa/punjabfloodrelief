import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['pa', 'en', 'hi'],

  // Used when no locale matches
  defaultLocale: 'pa'
})

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(pa|en|hi)/:path*']
}
