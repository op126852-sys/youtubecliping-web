// Inlines the Vite build's JS/CSS/favicon into a single self-contained
// dist/artifact.html — used only to produce the standalone demo artifact,
// which can't reference separate asset files.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(import.meta.dirname, '..', 'dist')
let html = readFileSync(join(dist, 'index.html'), 'utf8')

html = html.replace(
  /<script type="module" crossorigin src="\/assets\/([^"]+)"><\/script>/,
  (_match, file) => {
    const js = readFileSync(join(dist, 'assets', file), 'utf8')
    return `<script type="module">\n${js}\n</script>`
  },
)

html = html.replace(
  /<link rel="stylesheet" crossorigin href="\/assets\/([^"]+)">/,
  (_match, file) => {
    const css = readFileSync(join(dist, 'assets', file), 'utf8')
    return `<style>\n${css}\n</style>`
  },
)

html = html.replace(
  /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg" \/>/,
  () => {
    const svg = readFileSync(join(import.meta.dirname, '..', 'public', 'favicon.svg'), 'utf8')
    const b64 = Buffer.from(svg).toString('base64')
    return `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${b64}" />`
  },
)

writeFileSync(join(dist, 'artifact.html'), html)
console.log('Wrote dist/artifact.html', html.length, 'bytes')
