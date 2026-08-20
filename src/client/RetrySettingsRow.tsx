/** Global finite retry budget rendered in the General settings section. */

import { useEffect, useState } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { RetrySettings } from './settings-contract.ts'
import css from './RetrySettingsRow.module.css'

export interface RetrySettingsRowInjected {
  hooks: { retrySettings: SettingsScope<RetrySettings> }
  setMaxRetries: (value: number) => Promise<void>
}

export type RetrySettingsRowProps = PropsRuntime<'settings.general.item'>
  & PropsLocale<'settings.llmRetry'>
  & InjectFace<RetrySettingsRowInjected>

export function parseMaxRetries(raw: string): number | undefined {
  if (!/^\d+$/.test(raw.trim())) return undefined
  const value = Number(raw)
  return Number.isSafeInteger(value) ? value : undefined
}

export function RetrySettingsRow({ useRetrySettings, setMaxRetries, t }: RetrySettingsRowProps) {
  const snapshot = useRetrySettings(state => state)
  const current = snapshot.value?.maxRetries
  const [raw, setRaw] = useState(current === undefined ? '' : String(current))
  const [saving, setSaving] = useState(false)
  const parsed = parseMaxRetries(raw)
  const valid = parsed !== undefined
  const disabled = snapshot.status !== 'ready' || !snapshot.writable || saving

  useEffect(() => {
    setRaw(current === undefined ? '' : String(current))
  }, [current])

  const commit = (): void => {
    if (disabled || parsed === undefined || parsed === current) return
    setSaving(true)
    void setMaxRetries(parsed).finally(() => { setSaving(false) })
  }

  const status = saving
    ? t('saving')
    : snapshot.status === 'loading'
      ? t('loading')
      : snapshot.status === 'unavailable'
        ? t('unavailable')
        : !snapshot.writable
          ? t('readOnly')
          : undefined

  return (
    <div className={css.row}>
      <div className={css.text}>
        <div className={css.title}>{t('title')}</div>
        <p className={css.description}>{t('description')}</p>
        {!valid && raw.length > 0
          ? <p className={css.error} role="alert">{t('invalid')}</p>
          : status === undefined ? null : <p className={css.status}>{status}</p>}
      </div>
      <input
        className={css.input}
        type="number"
        min="0"
        max={Number.MAX_SAFE_INTEGER}
        step="1"
        value={raw}
        aria-label={t('title')}
        aria-invalid={!valid && raw.length > 0}
        disabled={disabled}
        onChange={(event) => { setRaw(event.target.value) }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
      />
    </div>
  )
}
