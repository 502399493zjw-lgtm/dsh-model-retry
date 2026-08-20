import { rm } from 'node:fs/promises'

await Promise.all([
  rm(new URL('../lib/index.js', import.meta.url), { force: true }),
  rm(new URL('../lib/index.js.map', import.meta.url), { force: true }),
  rm(new URL('../lib/client.js', import.meta.url), { force: true }),
  rm(new URL('../lib/client.js.map', import.meta.url), { force: true }),
  rm(new URL('../lib/style.css', import.meta.url), { force: true }),
  rm(new URL('../lib/types', import.meta.url), { recursive: true, force: true }),
])
