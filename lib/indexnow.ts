import { SITE_URL } from '@/lib/public-site'

// La clave de IndexNow es pública por diseño y se verifica mediante un archivo accesible en el dominio.
export const INDEXNOW_KEY = '5f3a9c7d2e4b6810a9d5f4c2b7e8a163'
export const INDEXNOW_KEY_PATH = `/${INDEXNOW_KEY}.txt`
export const INDEXNOW_KEY_URL = `${SITE_URL}${INDEXNOW_KEY_PATH}`

export const DEPRECATED_PUBLIC_URLS = [
  `${SITE_URL}/sales-kit`,
  `${SITE_URL}/demo/transporte`,
  `${SITE_URL}/demo/mineria`,
]
