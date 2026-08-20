import type { ComponentType } from 'react'

export interface SettingsSnapshot<T> {
  readonly value: T | undefined
  readonly status: 'loading' | 'ready' | 'unavailable'
  readonly writable: boolean
}

export interface SettingsScope<T> {
  bind<U>(options: { namespace: string }): SettingsScope<U>
  set(key: string, value: unknown): Promise<void>
}

export interface ClientContext {
  readonly settingsScope: SettingsScope<unknown>
  readonly locale: { register(namespace: string, dictionaries: unknown): void }
  readonly slots: {
    inject(name: string, register: () => void): void
    register(definition: unknown, component: ComponentType<any>): void
  }
  effect(callback: () => void, label?: string): void
}

export type InjectFace<T> = T & {
  readonly useRetrySettings: (selector: (state: SettingsSnapshot<any>) => any) => any
}
export type PropsLocale<T extends string> = { readonly t: (key: string) => string }
export type PropsRuntime<T extends string> = Record<string, never>

declare module '@deepseek-ai/dsh-client-runtime/client' {
  export type { ClientContext, SettingsScope }
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  export type { InjectFace, PropsLocale, PropsRuntime }
  interface LocaleNamespaceMap {}
}

declare module '@deepseek-ai/dsh-client-locale/client' {}
declare module '@deepseek-ai/dsh-client-ui-settings/client' {}
declare module '@deepseek-ai/dsh-api-remotes/client' {}
declare module '@deepseek-ai/cordis' {}
