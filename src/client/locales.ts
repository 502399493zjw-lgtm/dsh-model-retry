export const en = {
  title: 'Model request retries',
  description: 'Automatically retry failed model requests up to this many times. The first request is not counted.',
  invalid: 'Enter a non-negative whole number.',
  loading: 'Loading…',
  unavailable: 'Provider retry settings are unavailable.',
  readOnly: 'Provider retry settings are read-only.',
  saving: 'Saving…',
  noProviders: 'No active configurable providers found.',
  mixed: '{count} normal providers currently use different retry counts.',
  applies: 'Applied to {count} active normal providers.',
  unlimited: '{count} always-mode providers stay unlimited.',
  unit: 'times',
} as const

export const zh: Record<keyof typeof en, string> = {
  title: '模型请求重试次数',
  description: '模型请求失败时，最多自动重试这么多次；首次请求不计入重试次数。',
  invalid: '请输入非负整数。',
  loading: '正在加载…',
  unavailable: '提供方重试设置不可用。',
  readOnly: '提供方重试设置为只读。',
  saving: '正在保存…',
  noProviders: '未发现可配置的 active 提供方。',
  mixed: '当前 {count} 个 normal 提供方使用不同的重试次数。',
  applies: '已应用于 {count} 个 active normal 提供方。',
  unlimited: '{count} 个 always 提供方保持无限重试。',
  unit: '次',
}

export type RetrySettingsKey = keyof typeof en
