import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRetryMutations,
  collectRetryTargets,
  deriveRetryPolicyState,
  retryPolicyPath,
} from '../src/client/retry-policy.ts'
import { RetryPolicyController } from '../src/client/retry-policy-controller.ts'

const providers = [
  {
    provider: 'deepseek-official', displayName: 'DeepSeek', active: true,
    settingsNs: 'llm-deepseek', settingsPath: [],
  },
  {
    provider: 'openai', displayName: 'OpenAI', active: true,
    settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'openai'],
  },
  {
    provider: 'dormant', displayName: 'Dormant', active: false,
    settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'dormant'],
  },
]

test('builds provider-owned retry paths and ignores dormant providers', () => {
  assert.deepEqual(retryPolicyPath(providers[0]), ['retryPolicy'])
  assert.deepEqual(retryPolicyPath(providers[1]), ['providers', 'openai', 'retryPolicy'])
  assert.deepEqual(collectRetryTargets(providers), [
    {
      provider: 'deepseek-official', displayName: 'DeepSeek', settingsNs: 'llm-deepseek',
      retryPolicyPath: ['retryPolicy'],
    },
    {
      provider: 'openai', displayName: 'OpenAI', settingsNs: 'llm-pi-ai',
      retryPolicyPath: ['providers', 'openai', 'retryPolicy'],
    },
  ])
})

test('deduplicates providers that resolve to one settings address', () => {
  assert.equal(collectRetryTargets([
    providers[0],
    { ...providers[0], provider: 'deepseek-alias', displayName: 'Alias' },
  ]).length, 1)
})

test('derives stock default, mixed finite values, and unlimited providers', () => {
  const targets = collectRetryTargets(providers)
  const common = deriveRetryPolicyState(targets, [
    { ns: 'llm-deepseek', revision: 2, value: {} },
    { ns: 'llm-pi-ai', revision: 4, value: { providers: { openai: { retryPolicy: { mode: 'normal' } } } } },
  ])
  assert.deepEqual(common, {
    providerCount: 2, eligibleCount: 2, unlimitedCount: 0, maxRetries: 5, mixed: false,
  })

  const mixed = deriveRetryPolicyState(targets, [
    { ns: 'llm-deepseek', revision: 2, value: { retryPolicy: { mode: 'normal', maxRetries: 3 } } },
    { ns: 'llm-pi-ai', revision: 4, value: { providers: { openai: { retryPolicy: { mode: 'always' } } } } },
  ])
  assert.deepEqual(mixed, {
    providerCount: 2, eligibleCount: 1, unlimitedCount: 1, maxRetries: 3, mixed: false,
  })

  const differing = deriveRetryPolicyState(targets, [
    { ns: 'llm-deepseek', revision: 2, value: { retryPolicy: { mode: 'normal', maxRetries: 3 } } },
    { ns: 'llm-pi-ai', revision: 4, value: { providers: { openai: { retryPolicy: { mode: 'normal', maxRetries: 7 } } } } },
  ])
  assert.equal(differing.maxRetries, undefined)
  assert.equal(differing.mixed, true)
})

test('groups revision-fenced mutations and preserves always mode', () => {
  const mutations = buildRetryMutations(collectRetryTargets(providers), [
    { ns: 'llm-deepseek', revision: 2, value: {} },
    { ns: 'llm-pi-ai', revision: 4, value: { providers: { openai: { retryPolicy: { mode: 'always' } } } } },
  ], 6)
  assert.deepEqual(mutations, [{
    ns: 'llm-deepseek',
    expectedRevision: 2,
    ops: [{ op: 'set', path: ['retryPolicy'], value: { mode: 'normal', maxRetries: 6 } }],
  }])
})

test('uses nested maxRetries writes for existing normal policies in one namespace', () => {
  const piProviders = [
    providers[1],
    { ...providers[1], provider: 'anthropic', displayName: 'Anthropic', settingsPath: ['providers', 'anthropic'] },
  ]
  const mutations = buildRetryMutations(collectRetryTargets(piProviders), [{
    ns: 'llm-pi-ai', revision: 9,
    value: { providers: {
      openai: { retryPolicy: { mode: 'normal', maxRetries: 2, backoff: { maxDelayMs: 8000 } } },
      anthropic: { baseURL: 'https://example.test' },
    } },
  }], 8)
  assert.deepEqual(mutations, [{
    ns: 'llm-pi-ai', expectedRevision: 9,
    ops: [
      { op: 'set', path: ['providers', 'openai', 'retryPolicy', 'maxRetries'], value: 8 },
      { op: 'set', path: ['providers', 'anthropic', 'retryPolicy'], value: { mode: 'normal', maxRetries: 8 } },
    ],
  }])
})

test('controller loads rc.8 public faces and folds a revision-fenced write', async () => {
  const listeners = new Set()
  let mirrorSnapshot = {
    status: 'ready', error: null,
    view: {
      writable: true, hasDocument: true,
      namespaces: [
        { ns: 'llm-deepseek', revision: 2, value: {} },
        { ns: 'llm-pi-ai', revision: 4, value: { providers: { openai: { retryPolicy: { mode: 'always' } } } } },
      ],
    },
  }
  const mirror = {
    getSnapshot: () => mirrorSnapshot,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
    ensure: async () => {},
    acceptView: (view) => {
      mirrorSnapshot = {
        ...mirrorSnapshot,
        view: {
          ...mirrorSnapshot.view,
          namespaces: mirrorSnapshot.view.namespaces.map(row => row.ns === view.ns ? view : row),
        },
      }
      for (const listener of listeners) listener()
    },
  }
  const writes = []
  const api = {
    llm: { providers: async () => ({ result: { ok: true, value: { providers } } }) },
    settings: { mutate: async (request) => {
      writes.push(request)
      return {
        result: {
          ok: true,
          value: {
            ns: 'llm-deepseek', revision: 3,
            value: { retryPolicy: { mode: 'normal', maxRetries: 6 } },
          },
        },
      }
    } },
  }
  const controller = new RetryPolicyController(api, mirror)
  await controller.load()
  assert.deepEqual(controller.store.getSnapshot(), {
    status: 'ready', saving: false, error: null, writable: true,
    providerCount: 2, eligibleCount: 1, unlimitedCount: 1,
    maxRetries: 5, mixed: false,
  })

  await controller.setMaxRetries(6)
  assert.deepEqual(writes, [{
    ns: 'llm-deepseek', expectedRevision: 2,
    ops: [{ op: 'set', path: ['retryPolicy'], value: { mode: 'normal', maxRetries: 6 } }],
  }])
  assert.equal(controller.store.getSnapshot().maxRetries, 6)
  assert.equal(controller.store.getSnapshot().saving, false)
  controller.dispose()
})
