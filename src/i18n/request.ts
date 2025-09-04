import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is valid, fallback to 'pa' if not
  const validLocale = locale && ['pa', 'en', 'hi'].includes(locale) ? locale : 'pa'

  try {
    const messages = (await import(`./locales/${validLocale}.json`)).default
    return { messages }
  } catch (error) {
    console.warn(`Failed to load messages for locale ${validLocale}, falling back to English`)
    // Fallback to English if the locale file doesn't exist
    const fallbackMessages = (await import('./locales/en.json')).default
    return { messages: fallbackMessages }
  }
})
