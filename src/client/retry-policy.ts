/** Pure rc.8 provider-policy projection and mutation planning. */

export const DEFAULT_MAX_RETRIES = 5

export interface ConfigurableProviderAddress {
  readonly provider: string
  readonly displayName: string
  readonly settingsNs: string
  readonly settingsPath: readonly string[]
  readonly active: boolean
}

export interface SettingsNamespaceValue {
  readonly ns: string
  readonly revision: number
  readonly value: unknown
}

export interface RetryTarget {
  readonly provider: string
  readonly displayName: string
  readonly settingsNs: string
  readonly retryPolicyPath: readonly string[]
}

export interface RetryPolicyState {
  readonly providerCount: number
  readonly eligibleCount: number
  readonly unlimitedCount: number
  readonly maxRetries: number | undefined
  readonly mixed: boolean
}

export interface RetryMutation {
  readonly ns: string
  readonly expectedRevision: number
  readonly ops: readonly ({
    readonly op: 'set'
    readonly path: readonly string[]
    readonly value: unknown
  })[]
}

interface RetryPolicyValue {
  readonly mode?: unknown
  readonly maxRetries?: unknown
}

/** The rc.8 provider-owned retry-policy address for one directory entry. */
export function retryPolicyPath(provider: ConfigurableProviderAddress): string[] {
  return [...provider.settingsPath, 'retryPolicy']
}

/** Keep only active, writable-address providers and collapse aliases of one address. */
export function collectRetryTargets(providers: readonly ConfigurableProviderAddress[]): RetryTarget[] {
  const seen = new Set<string>()
  const targets: RetryTarget[] = []
  for (const provider of providers) {
    if (!provider.active || provider.settingsNs.length === 0) continue
    const path = retryPolicyPath(provider)
    const key = `${provider.settingsNs}\u0000${JSON.stringify(path)}`
    if (seen.has(key)) continue
    seen.add(key)
    targets.push({
      provider: provider.provider,
      displayName: provider.displayName,
      settingsNs: provider.settingsNs,
      retryPolicyPath: path,
    })
  }
  return targets
}

function objectAtPath(value: unknown, path: readonly string[]): unknown {
  let cursor = value
  for (const segment of path) {
    if (typeof cursor !== 'object' || cursor === null || Array.isArray(cursor)) return undefined
    cursor = (cursor as Record<string, unknown>)[segment]
  }
  return cursor
}

function policyAt(target: RetryTarget, namespace: SettingsNamespaceValue): RetryPolicyValue | undefined {
  const value = objectAtPath(namespace.value, target.retryPolicyPath)
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as RetryPolicyValue
    : undefined
}

/** Summarize the finite retry count while preserving rc.8 `always` providers. */
export function deriveRetryPolicyState(
  targets: readonly RetryTarget[],
  namespaces: readonly SettingsNamespaceValue[],
): RetryPolicyState {
  const byNs = new Map(namespaces.map(namespace => [namespace.ns, namespace]))
  const finite = new Set<number>()
  let eligibleCount = 0
  let unlimitedCount = 0

  for (const target of targets) {
    const namespace = byNs.get(target.settingsNs)
    if (namespace === undefined) continue
    const policy = policyAt(target, namespace)
    if (policy?.mode === 'always') {
      unlimitedCount += 1
      continue
    }
    eligibleCount += 1
    finite.add(Number.isSafeInteger(policy?.maxRetries) && Number(policy?.maxRetries) >= 0
      ? Number(policy?.maxRetries)
      : DEFAULT_MAX_RETRIES)
  }

  return {
    providerCount: targets.length,
    eligibleCount,
    unlimitedCount,
    maxRetries: finite.size === 1 ? finite.values().next().value : undefined,
    mixed: finite.size > 1,
  }
}

/** Build one revision-fenced path mutation per settings namespace. */
export function buildRetryMutations(
  targets: readonly RetryTarget[],
  namespaces: readonly SettingsNamespaceValue[],
  maxRetries: number,
): RetryMutation[] {
  if (!Number.isSafeInteger(maxRetries) || maxRetries < 0) {
    throw new RangeError('maxRetries must be a non-negative safe integer')
  }
  const byNs = new Map(namespaces.map(namespace => [namespace.ns, namespace]))
  const grouped = new Map<string, RetryMutation['ops'] extends readonly (infer T)[] ? T[] : never>()

  for (const target of targets) {
    const namespace = byNs.get(target.settingsNs)
    if (namespace === undefined) continue
    const policy = policyAt(target, namespace)
    if (policy?.mode === 'always') continue
    const op = policy?.mode === 'normal'
      ? { op: 'set' as const, path: [...target.retryPolicyPath, 'maxRetries'], value: maxRetries }
      : { op: 'set' as const, path: [...target.retryPolicyPath], value: { mode: 'normal', maxRetries } }
    const existing = grouped.get(target.settingsNs)
    if (existing === undefined) grouped.set(target.settingsNs, [op])
    else existing.push(op)
  }

  return [...grouped].map(([ns, ops]) => ({
    ns,
    expectedRevision: byNs.get(ns)!.revision,
    ops,
  }))
}
