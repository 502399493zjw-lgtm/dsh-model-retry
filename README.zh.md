# @zhongjingwei/dsh-model-retry

[![CI](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml/badge.svg)](https://github.com/502399493zjw-lgtm/dsh-model-retry/actions/workflows/ci.yml)

[English](README.md) | 中文

DeepSeek Harness Web 插件：在 **设置 → 通用** 中配置旧版全局模型请求重试次数。

> 兼容范围：明确固定为 DSH `0.1.0-rc.5`。它不兼容 DSH `0.1.0-rc.8`；新版已将重试策略移动到各 Provider Profile，并移除了全局 `llm-retry/maxRetries` 命名空间。

## 演示

![把模型请求重试次数设为 3，并在三次 DSH 重试后恢复](https://raw.githubusercontent.com/502399493zjw-lgtm/dsh-model-retry/main/docs/assets/dsh-model-retry-demo.gif)

录制使用真实 DSH 产品界面，并将打包后的插件安装到隔离 `DSH_HOME`。演示从默认值 `2` 改为 `3`、重新打开设置后仍保持为 `3`，随后真实产生三次 DSH 重试事件并恢复。失败由本地确定性 HTTP mock 触发，没有调用外部模型。

## 安装

仅用于明确固定在 rc.5 的 Web Profile：

```bash
dsh plugin --profile web add @zhongjingwei/dsh-model-retry@next
```

安装后重启 Web。卸载命令：

```bash
dsh plugin --profile web remove @zhongjingwei/dsh-model-retry
```

## 功能边界

- 在“设置 → 通用”增加一个数字型重试次数设置项。
- 接受有限的非负整数，包括 `0`。
- 通过 rc.5 的 `llm-retry/maxRetries` 设置域持久化。
- 实际重试与退避逻辑仍由 DSH 重试服务负责。

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
