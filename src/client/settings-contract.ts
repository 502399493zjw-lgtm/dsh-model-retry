export const RETRY_SETTINGS_NAMESPACE = 'llm-retry'
export const MAX_RETRIES_FIELD = 'maxRetries'

export interface RetrySettings {
  maxRetries: number
}
