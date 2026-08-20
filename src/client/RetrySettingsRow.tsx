/** One finite retry budget projected across active rc.8 normal providers. */

import { useEffect, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { RetryPolicyController, RetryPolicySnapshot } from './retry-policy-controller.ts'
import css from './RetrySettingsRow.module.css'

export interface RetrySettingsRowInjected {
  controller: RetryPolicyController
  hooks: { retrySettings: { getSnapshot(): RetryPolicySnapshot; subscribe(fn: () => void): () => void } }
}

export type RetrySettingsRowProps = PropsRuntime<'settings.general.item'>
  & PropsLocale<'settings.llmRetry'>
  & InjectFace<RetrySettingsRowInjected>

export function parseMaxRetries(raw: string): number | undefined {
  if (!/^\d+$/.test(raw.trim())) return undefined
  const value = Number(raw)
  return Number.isSafeInteger(value) ? value : undefined
}

export function RetrySettingsRow({ useRetrySettings, controller, t }: RetrySettingsRowProps) {
  const snapshot = useRetrySettings(state => state)
  const current = snapshot.maxRetries
  const [raw, setRaw] = useState(current === undefined ? '' : String(current))
  const parsed = parseMaxRetries(raw)
  const valid = parsed !== undefined
  const disabled = snapshot.status !== 'ready' || !snapshot.writable || snapshot.saving
  const unchanged = !snapshot.mixed && parsed === current

  useEffect(() => {
    setRaw(current === undefined ? '' : String(current))
  }, [current])

  const commit = (): void => {
    if (disabled || parsed === undefined || unchanged) return
    void controller.setMaxRetries(parsed)
  }

  const status = snapshot.saving
    ? t('saving')
    : snapshot.status === 'idle' || snapshot.status === 'loading'
      ? t('loading')
      : snapshot.status === 'unavailable'
        ? t('unavailable')
        : !snapshot.writable
          ? t('readOnly')
          : snapshot.providerCount === 0
            ? t('noProviders')
            : snapshot.mixed
              ? t('mixed', { count: snapshot.eligibleCount })
              : t('applies', { count: snapshot.eligibleCount })

  const unlimited = snapshot.unlimitedCount > 0
    ? t('unlimited', { count: snapshot.unlimitedCount })
    : null

  return (
    <div className={css.row}>
      <div className={css.text}>
        <div className={css.title}>{t('title')}</div>
        <p className={css.description}>{t('description')}</p>
        {!valid && raw.length > 0
          ? <p className={css.error} role="alert">{t('invalid')}</p>
          : <p className={css.status}>{status}{unlimited === null ? null : <> {unlimited}</>}</p>}
        {snapshot.error === null ? null : <p className={css.error} role="alert">{snapshot.error}</p>}
      </div>
      <div className={css.control}>
        <input
          className={css.input}
          type="number"
          min="0"
          max={Number.MAX_SAFE_INTEGER}
          step="1"
          value={raw}
          placeholder={snapshot.mixed ? '—' : undefined}
          aria-label={t('title')}
          aria-invalid={!valid && raw.length > 0}
          disabled={disabled}
          onChange={(event) => { setRaw(event.target.value) }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
          }}
        />
        <button
          className={css.button}
          type="button"
          disabled={disabled || !valid || unchanged}
          onClick={commit}
        >{t('apply')}</button>
      </div>
    </div>
  )
}
