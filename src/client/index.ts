/** Browser plugin that contributes the global model-request retry row. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import { RetrySettingsRow, type RetrySettingsRowInjected } from './RetrySettingsRow.tsx'
import { en, zh, type RetrySettingsKey } from './locales.ts'
import {
  MAX_RETRIES_FIELD, RETRY_SETTINGS_NAMESPACE, type RetrySettings,
} from './settings-contract.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.llmRetry': RetrySettingsKey
  }
}

export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope']

export function apply(ctx: ClientContext): void {
  const scope = ctx.settingsScope.bind<RetrySettings>({ namespace: RETRY_SETTINGS_NAMESPACE })
  ctx.effect(() => ctx.locale.register('settings.llmRetry', { zh, en }), 'model-retry: settings row dictionaries')
  const injected = (): RetrySettingsRowInjected => ({
    hooks: { retrySettings: scope },
    setMaxRetries: value => scope.set(MAX_RETRIES_FIELD, value),
  })
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'model-request-retries',
    order: 20,
    locale: 'settings.llmRetry',
    inject: injected,
  }, RetrySettingsRow))
}
