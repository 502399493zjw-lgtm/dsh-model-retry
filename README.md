# @zhongjingwei/dsh-model-retry

[![CI](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml/badge.svg)](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml)

English | [中文](README.zh.md)

DeepSeek Harness Web plugin for configuring the legacy global model-request retry budget from **Settings → General**.

> Compatibility: intentionally pinned to DSH `0.1.0-rc.5`. It is not compatible with DSH `0.1.0-rc.8`, where retry policy moved into each provider profile and the global `llm-retry/maxRetries` namespace was removed.

## Demo

![Set the retry budget to 3 and recover after three DSH retries](https://raw.githubusercontent.com/502399493zjw-lgtm/dsh-model-retry/main/docs/assets/dsh-model-retry-demo.gif)

The recording uses the real DSH product UI and a packed plugin tarball installed into an isolated `DSH_HOME`. The value changes from the default `2` to `3`, persists after reopening Settings, and drives three visible DSH retry events before recovery. A deterministic local HTTP mock produced the failures; no external model was called.

## Install

Use only with an intentionally pinned rc.5 Web profile:

```bash
dsh plugin --profile web add @zhongjingwei/dsh-model-retry@next
```

Restart Web after installation. Remove the plugin with:

```bash
dsh plugin --profile web remove @zhongjingwei/dsh-model-retry
```

## Behavior

- Adds one numeric retry-count row to Settings → General.
- Accepts finite, non-negative integers, including `0`.
- Persists through the rc.5 `llm-retry/maxRetries` settings scope.
- Leaves retry execution and backoff behavior owned by DSH's retry service.

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
