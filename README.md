# @zhongjingwei/dsh-model-retry

[![CI](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml/badge.svg)](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml)

English | [中文](README.zh.md)

DeepSeek Harness Web plugin for configuring active providers' model-request retry budget from **Settings → General**.

> Compatibility: pinned to stock DSH `0.1.0-rc.8`. rc.8 moved retry ownership into provider profiles, so this version writes each active normal provider's `retryPolicy.maxRetries` through the published settings API.

## Demo

![Set the retry budget to 3 and recover after three DSH retries](https://raw.githubusercontent.com/502399493zjw-lgtm/dsh-model-retry/main/docs/assets/dsh-model-retry-demo.gif)

The current recording documents the rc.5 product flow. The rc.8 UI keeps the same General-settings entry, but now reports how many active normal providers will change and how many always-mode providers remain unlimited. A refreshed rc.8 recording should be produced before release.

## Install

For stock rc.8 after this package version is published:

```bash
dsh plugin --profile web add @zhongjingwei/dsh-model-retry@0.1.0-rc.8
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
