# @zhongjingwei/dsh-model-retry

[![CI](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml/badge.svg)](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml)

[English](README.md) | 中文

DeepSeek Harness Web 插件：在 **设置 → 通用** 中统一配置 active 提供方的模型请求重试次数。

> 兼容范围：明确固定为 stock DSH `0.1.0-rc.8`。rc.8 已把重试策略移动到 Provider Profile；此版本通过公开设置 API 写入每个 active normal 提供方的 `retryPolicy.maxRetries`。

## 演示

![在 stock DSH rc.8 中把模型请求重试次数从 5 改为 7，重开设置确认持久化，并在可重试失败后自动恢复](https://raw.githubusercontent.com/502399493zjw-lgtm/dsh-model-retry/main/docs/assets/dsh-model-retry-demo.gif)

演示来自 stock DSH `0.1.0-rc.8` 和本分支 `fb39c3b` 打出的插件 tarball，全部安装在隔离的 `DSH_HOME`。画面先把两个 active normal 提供方的重试次数从 `5` 改为 `7`，重开设置确认持久化，再使用 DSH 自带的本地 LLM mock 让前三次请求返回可重试错误、第四次成功。重试执行和状态提示来自 DSH；插件负责统一设置重试预算。

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
