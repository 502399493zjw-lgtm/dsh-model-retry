# @zhongjingwei/dsh-model-retry

[![CI](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml/badge.svg)](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml)

English | [中文](README.zh.md)

DeepSeek Harness Web plugin for configuring active providers' model-request retry budget from **Settings → General**.

> Compatibility: pinned to stock DSH `0.1.0-rc.8`. rc.8 moved retry ownership into provider profiles, so this version writes each active normal provider's `retryPolicy.maxRetries` through the published settings API.

## Demo

![Change the retry budget from 5 to 7 on stock DSH rc.8, reopen Settings to prove persistence, and recover from retryable failures](https://raw.githubusercontent.com/502399493zjw-lgtm/dsh-model-retry/main/docs/assets/dsh-model-retry-demo.gif)

The demo uses stock DSH `0.1.0-rc.8` and a plugin tarball packed from this branch at `fb39c3b`, all under an isolated `DSH_HOME`. It changes two active normal providers from `5` retries to `7`, reopens Settings to prove persistence, then uses DSH's local LLM mock to return retryable errors for the first three requests and succeed on the fourth. DSH executes and reports the retries; the plugin owns the shared retry-budget setting.

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
