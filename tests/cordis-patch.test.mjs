import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const buildConfig = await readFile(new URL('../tsdown.config.ts', import.meta.url), 'utf8')
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8')

test('the standalone bundle inserts only the model-retry plugin', () => {
  assert.match(patch, /^\s*- id: model-retry$/m)
  assert.match(patch, /^\s+name: ['"]?@zhongjingwei\/dsh-model-retry['"]?$/m)
  assert.doesNotMatch(patch, /ui-settings-model-retry/)
})

test('the legacy source remains self-contained and cannot be mistaken for rc.8 compatible', () => {
  assert.deepEqual(packageJson.repository, {
    type: 'git',
    url: 'git+https://github.com/502399493zjw-lgtm/dsh-model-retry.git',
  })
  assert.equal(packageJson.homepage, 'https://github.com/502399493zjw-lgtm/dsh-model-retry#readme')
  assert.equal(packageJson.bugs?.url, 'https://github.com/502399493zjw-lgtm/dsh-model-retry/issues')
  assert.doesNotMatch(buildConfig, /\/Users\/|deepseek-harness\/packages/u)
  assert.match(readme, /not compatible with DSH `0\.1\.0-rc\.8`/u)
  assert.match(readme, /docs\/assets\/dsh-model-retry-demo\.gif/u)
})
