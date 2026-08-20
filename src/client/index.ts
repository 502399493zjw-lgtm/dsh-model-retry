/** Browser plugin that contributes one rc.8 provider-policy retry row. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-remotes/types'
import type {} from '@deepseek-ai/dsh-llm/types'
import { RetrySettingsRow, type RetrySettingsRowInjected } from './RetrySettingsRow.tsx'
import { en, zh, type RetrySettingsKey } from './locales.ts'
import { RetryPolicyController } from './retry-policy-controller.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.llmRetry': RetrySettingsKey
  }
}

export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register('settings.llmRetry', { zh, en }), 'model-retry: settings row dictionaries')
  const connection = ctx.get('connection') as ConnectionHandle
  const controller = new RetryPolicyController(connection.api, ctx.settingsScope.describe())
  const injected = (): RetrySettingsRowInjected => ({
    controller,
    hooks: { retrySettings: controller.store },
  })

  ctx.effect(() => {
    const refresh = (): void => { void controller.load() }
    const disposers = [
      ctx.remote.$on('llm/adapters-updated', refresh),
      ctx.on('connection/reset', refresh),
    ]
    refresh()
    return () => {
      controller.dispose()
      for (const dispose of disposers) dispose()
    }
  }, 'model-retry: provider policy state')

  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'model-request-retries',
    order: 20,
    locale: 'settings.llmRetry',
    inject: injected,
  }, RetrySettingsRow))
}
