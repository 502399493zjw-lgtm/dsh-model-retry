# @zhongjingwei/dsh-model-retry

[![CI](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml/badge.svg)](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml)

English | [中文](README.zh.md)

DeepSeek Harness Web plugin for configuring active providers' model-request retry budget from **Settings → General**.

> Compatibility: pinned to stock DSH `0.1.0-rc.8`. rc.8 moved retry ownership into provider profiles, so this version writes each active normal provider's `retryPolicy.maxRetries` through the published settings API.

## Demo

![Set the retry budget to 5, show retries 1/5 through 5/5, and recover when the sixth model request succeeds](https://raw.githubusercontent.com/502399493zjw-lgtm/dsh-model-retry/main/docs/assets/dsh-model-retry-demo.gif)

The demo uses stock DSH `0.1.0-rc.8` and a plugin tarball packed from this source, all under an isolated `DSH_HOME`. It changes the retry budget from `2` to `5`, then uses DSH's deterministic local LLM mock to return retryable server errors on attempts 1–5 and succeed on attempt 6. Session-title generation is disabled so those six mock requests belong only to the demonstrated model request. DSH executes and reports the retries; the plugin owns the shared retry-budget setting.

## Install

For stock rc.8:

```bash
dsh plugin --profile web add @zhongjingwei/dsh-model-retry@0.1.0-rc.9
```

Restart Web after installation. Remove the plugin with:

```bash
dsh plugin --profile web remove @zhongjingwei/dsh-model-retry
```

## Behavior

- Adds one numeric retry-count row to Settings → General and shows its provider scope.
- Accepts finite, non-negative integers, including `0`.
- Discovers active configurable providers through `llm.providers` and uses revision-fenced `settings.mutate` calls.
- Writes `retryPolicy.maxRetries` for normal/default policies while preserving existing backoff and retryable-code fields.
- Leaves `always` policies unlimited and leaves retry execution/backoff behavior owned by DSH.

## Development

```bash
pnpm install
pnpm test
pnpm run build
pnpm run verify:package
pnpm pack
```

The package is an external Cordis plugin and does not patch DSH core.

## License

MIT
