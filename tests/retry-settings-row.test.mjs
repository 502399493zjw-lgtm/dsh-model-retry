import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/client/RetrySettingsRow.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/client/RetrySettingsRow.module.css', import.meta.url), 'utf8')
const locales = await readFile(new URL('../src/client/locales.ts', import.meta.url), 'utf8')

test('the retry setting is a compact number stepper that commits on blur', () => {
  assert.match(component, /type="number"/u)
  assert.match(component, /min="0"/u)
  assert.match(component, /step="1"/u)
  assert.match(component, /onBlur=\{commit\}/u)
  assert.match(component, /className=\{css\.unit\}>\{t\('unit'\)\}<\/span>/u)
  assert.doesNotMatch(component, /<button/u)
  assert.match(styles, /\.unit\s*\{/u)
  assert.match(locales, /unit: '次'/u)
})

test('Enter saves through the same blur path and Escape restores the saved value', () => {
  assert.match(component, /event\.key === 'Enter'/u)
  assert.match(component, /event\.currentTarget\.blur\(\)/u)
  assert.match(component, /event\.key === 'Escape'/u)
  assert.match(component, /setRaw\(current === undefined \? '' : String\(current\)\)/u)
})
