import { defineNuxtConfig } from 'nuxt/config'

// Configurações de headers para evitar cache
const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

export default defineNuxtConfig({
    future: { compatibilityVersion: 4 },
    devtools: { enabled: true },
    typescript: { strict: true },
    css: ['~/assets/css/tailwind.css'],
    modules: ['@vueuse/motion/nuxt'],

    // Configurações de roteamento
    routeRules: {
        '/api/**': {
            cors: true,
            headers: noCacheHeaders
        }
    },

    // Configurações de compilação
    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    },

    // Variáveis de ambiente
    runtimeConfig: {
        public: {
            statusEndpoint: process.env.NUXT_PUBLIC_STATUS_ENDPOINT || ''
        }
    },

    // Configurações do servidor
    nitro: {
        preset: 'vercel-edge',
        routeRules: {
            '/api/**': {
                cors: true,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            }
        }
    },

    // Configurações de renderização
    app: {
        head: {
            meta: [
                { 'http-equiv': 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
                { 'http-equiv': 'Pragma', content: 'no-cache' },
                { 'http-equiv': 'Expires', content: '0' }
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/logo.ico' }
            ]
        }
    }
})
