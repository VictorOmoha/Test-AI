import build from '@hono/vite-build/vercel'
import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      entry: 'src/index.tsx'
    })
  ]
})
