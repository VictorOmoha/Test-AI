import build from '@hono/vite-build/vercel'
import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const injectMaxDuration = () => ({
  name: 'inject-max-duration',
  closeBundle() {
    const vcConfigPath = resolve('.vercel/output/functions/__hono.func/.vc-config.json')
    if (existsSync(vcConfigPath)) {
      const cfg = JSON.parse(readFileSync(vcConfigPath, 'utf8'))
      cfg.maxDuration = 60
      writeFileSync(vcConfigPath, JSON.stringify(cfg))
    }
  }
})

export default defineConfig({
  define: {
    'process.env': 'process.env'
  },
  plugins: [
    build(),
    devServer({
      entry: 'src/index.tsx'
    }),
    injectMaxDuration()
  ]
})
