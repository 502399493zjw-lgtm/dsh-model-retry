export const en = {
  title: 'Model request retries',
  description: 'Retry every eligible normal-mode model request this many times after the first attempt. Applies globally; always-mode provider policies remain unlimited.',
  invalid: 'Enter a non-negative whole number.',
  loading: 'Loading…',
  unavailable: 'Global retry settings are unavailable.',
  readOnly: 'Global retry settings are read-only.',
  saving: 'Saving…',
} as const

export const zh: Record<keyof typeof en, string> = {
  title: '模型请求重试次数',
  description: '首次尝试失败后，对所有符合条件的 normal 模型请求重试此次数。设置全局生效；always 提供方策略仍不设上限。',
  invalid: '请输入非负整数。',
  loading: '正在加载…',
  unavailable: '全局重试设置不可用。',
  readOnly: '全局重试设置为只读。',
  saving: '正在保存…',
}

export type RetrySettingsKey = keyof typeof en
