import { readdir, readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const requiredFiles = [
  'lib/index.js',
  'lib/client.js',
  'lib/types/index.d.ts',
  'lib/types/client/index.d.ts',
  'cordis.patch.yml',
  'README.md',
  'README.zh.md',
  'LICENSE',
]

for (const file of requiredFiles) {
  const details = await stat(join(root, file))
  if (!details.isFile() || details.size === 0) throw new Error(`missing package file: ${file}`)
}

async function walk(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else if (!path.endsWith('.map')) files.push(path)
  }
  return files
}

for (const file of await walk(join(root, 'lib'))) {
  const contents = await readFile(file, 'utf8')
  if (/\/Users\/|[A-Za-z]:\\\\Users\\\\/u.test(contents)) {
    throw new Error(`machine-specific path in ${relative(root, file)}`)
  }
}

if (packageJson.repository?.url !== 'git+https://github.com/502399493zjw-lgtm/dsh-model-retry.git') {
  throw new Error('unexpected repository metadata')
}
if (packageJson.exports?.['./cordis.patch.yml'] !== './cordis.patch.yml') {
  throw new Error('cordis.patch.yml must be exported')
}
if (!packageJson.files?.includes('LICENSE')) {
  throw new Error('LICENSE must be included in the published files')
}
if (packageJson.peerDependencies?.['@deepseek-ai/cordis'] !== '4.0.1') {
  throw new Error('Cordis peer dependency must match the verified baseline')
}
if (packageJson.engines?.node !== '^22.19.0 || >=24.0.0') {
  throw new Error('Node engine must match the verified baseline')
}
if (packageJson.packageManager !== 'pnpm@11.7.0') {
  throw new Error('pnpm version must match the verified baseline')
}

console.log('package files and public metadata verified')
