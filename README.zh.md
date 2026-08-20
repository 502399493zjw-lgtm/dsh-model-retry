# @zhongjingwei/dsh-model-retry

[![CI](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml/badge.svg)](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml)

[English](README.md) | 中文

DeepSeek Harness Web 插件：在 **设置 → 通用** 中统一配置 active 提供方的模型请求重试次数。

> 兼容范围：明确固定为 stock DSH `0.1.0-rc.8`。rc.8 已把重试策略移动到 Provider Profile；此版本通过公开设置 API 写入每个 active normal 提供方的 `retryPolicy.maxRetries`。

## 演示

![把模型请求重试次数设为 3，并在三次 DSH 重试后恢复](https://raw.githubusercontent.com/502399493zjw-lgtm/dsh-model-retry/main/docs/assets/dsh-model-retry-demo.gif)

当前录屏记录的是 rc.5 产品流程。rc.8 仍在“设置 → 通用”提供同一个入口，同时会明确显示将修改多少个 active normal 提供方、多少个 always 提供方保持无限重试；正式发布前应补录 rc.8 演示。

## 安装

此版本发布后，在 stock rc.8 Web Profile 中安装：

```bash
dsh plugin --profile web add @zhongjingwei/dsh-model-retry@0.1.0-rc.8
```

安装后重启 Web。卸载命令：

```bash
dsh plugin --profile web remove @zhongjingwei/dsh-model-retry
```

## 功能边界

- 在“设置 → 通用”增加一个数字型重试次数设置项，并显示实际影响的提供方范围。
- 接受有限的非负整数，包括 `0`。
- 通过 `llm.providers` 发现 active 可配置提供方，并使用带 revision 的 `settings.mutate` 持久化。
- 为 normal/默认策略写入 `retryPolicy.maxRetries`，保留已有退避和可重试错误码配置。
- `always` 策略保持无限重试；实际重试与退避执行仍由 DSH 负责。

## 开发验证

```bash
pnpm install
pnpm test
pnpm run build
pnpm run verify:package
pnpm pack
```

这是独立的 Cordis 插件，不修改 DSH 核心代码。

## 许可证

MIT
