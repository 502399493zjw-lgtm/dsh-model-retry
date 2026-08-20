/** Browser controller joining the rc.8 provider directory with the shared settings mirror. */

import type {
  ConfigurableProviderView, IApiClient, SettingsNamespaceView,
} from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  buildRetryMutations, collectRetryTargets, deriveRetryPolicyState,
  type RetryTarget,
} from './retry-policy.ts'

type RetryApi = Pick<IApiClient, 'llm' | 'settings'>

export interface RetryPolicySnapshot {
  readonly status: 'idle' | 'loading' | 'ready' | 'unavailable'
  readonly saving: boolean
  readonly error: string | null
  readonly writable: boolean
  readonly providerCount: number
  readonly eligibleCount: number
  readonly unlimitedCount: number
  readonly maxRetries: number | undefined
  readonly mixed: boolean
}

const EMPTY_STATE: RetryPolicySnapshot = {
  status: 'idle', saving: false, error: null, writable: false,
  providerCount: 0, eligibleCount: 0, unlimitedCount: 0,
  maxRetries: undefined, mixed: false,
}

/** Small browser-neutral observable; the slot renderer turns it into a selector hook. */
class RetryPolicyStore {
  private snapshot: RetryPolicySnapshot
  private readonly listeners = new Set<() => void>()

  constructor(snapshot: RetryPolicySnapshot) {
    this.snapshot = snapshot
  }

  getSnapshot(): RetryPolicySnapshot {
    return this.snapshot
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  set(snapshot: RetryPolicySnapshot): void {
    this.snapshot = snapshot
    for (const listener of [...this.listeners]) listener()
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Observable state and serialized public-wire writes for the General row. */
export class RetryPolicyController {
  readonly store = new RetryPolicyStore(EMPTY_STATE)

  private readonly api: RetryApi
  private readonly describe: SettingsDescribeFace
  private generation = 0
  private providers: readonly ConfigurableProviderView[] = []
  private targets: readonly RetryTarget[] = []
  private namespaces: readonly SettingsNamespaceView[] = []
  private readonly unsubscribe: () => void

  constructor(
    api: RetryApi,
    describe: SettingsDescribeFace,
  ) {
    this.api = api
    this.describe = describe
    this.unsubscribe = describe.subscribe(() => { this.deriveFromMirror() })
  }

  /** Load the provider directory; settings share DSH's single describe mirror. */
  async load(): Promise<void> {
    const generation = ++this.generation
    this.store.set({ ...this.store.getSnapshot(), status: 'loading', error: null })
    try {
      const [providersResponse] = await Promise.all([
        this.api.llm.providers({}),
        this.describe.ensure(),
      ])
      if (!providersResponse.result.ok) throw new Error(providersResponse.result.error.message)
      if (generation !== this.generation) return
      this.providers = providersResponse.result.value.providers
      this.targets = collectRetryTargets(this.providers)
      this.deriveFromMirror()
    } catch (error) {
      if (generation !== this.generation) return
      this.store.set({
        ...this.store.getSnapshot(),
        status: 'unavailable',
        saving: false,
        writable: false,
        error: messageOf(error),
      })
    }
  }

  /** Apply one finite budget to all active normal/default providers. */
  async setMaxRetries(maxRetries: number): Promise<void> {
    const before = this.store.getSnapshot()
    if (before.status !== 'ready' || !before.writable || before.saving) return
    const mutations = buildRetryMutations(this.targets, this.namespaces, maxRetries)
    this.store.set({ ...before, saving: true, error: null })
    try {
      for (const mutation of mutations) {
        const response = await this.api.settings.mutate({
          ns: mutation.ns,
          expectedRevision: mutation.expectedRevision,
          ops: mutation.ops.map(op => ({ ...op, path: [...op.path] })),
        })
        if (!response.result.ok) throw new Error(response.result.error.message)
        this.describe.acceptView(response.result.value)
      }
      this.store.set({ ...this.store.getSnapshot(), saving: false, error: null })
    } catch (error) {
      this.store.set({ ...this.store.getSnapshot(), saving: false, error: messageOf(error) })
    }
  }

  dispose(): void {
    this.generation += 1
    this.unsubscribe()
  }

  private deriveFromMirror(): void {
    const mirrored = this.describe.getSnapshot()
    if (mirrored.view === undefined) {
      if (mirrored.status === 'unavailable') {
        this.store.set({
          ...this.store.getSnapshot(), status: 'unavailable', writable: false,
          error: mirrored.error ?? 'settings are unavailable in this browser',
        })
      }
      return
    }
    this.namespaces = mirrored.view.namespaces
    const summary = deriveRetryPolicyState(this.targets, this.namespaces)
    this.store.set({
      ...this.store.getSnapshot(),
      status: 'ready',
      error: mirrored.error,
      writable: mirrored.view!.writable,
      ...summary,
    })
  }
}
