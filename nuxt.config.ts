import { defineNuxtConfig } from 'nuxt/config'

const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

export default defineNuxtConfig({
    future: { compatibilityVersion: 4 },
    devtools: { enabled: true },
    typescript: { strict: true },
    css: ['~/assets/scss/main.scss'],
    modules: ['@vueuse/motion/nuxt'],
    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    },
    runtimeConfig: {
        wsAdminKey: process.env.WS_ADMIN_KEY || '',
        public: {
            statusEndpoint: '/api/status',
            wsAdminBase: process.env.NUXT_PUBLIC_WS_ADMIN_BASE || '',
            versioningMetaUrl: process.env.NUXT_PUBLIC_VERSIONING_META_URL || 'https://cdn.shindoclient.com/data/meta/versioning.json'
        }
    },
    app: {
        head: {
            meta: [
                { 'http-equiv': 'Cache-Control', content: noCacheHeaders['Cache-Control'] },
                { 'http-equiv': 'Pragma', content: noCacheHeaders['Pragma'] },
                { 'http-equiv': 'Expires', content: noCacheHeaders['Expires'] }
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/logo.ico' },
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Outfit:wght@500;600;700&display=swap'
                }
            ]
        }
    }
})
