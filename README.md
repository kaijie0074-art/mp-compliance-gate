# mp-compliance-gate · 微信小程序 AI 功能上架合规门禁

> 代码完成到用户可用之间的合规工程链——把提审 checklist 从「人脑记忆」变成「可机械执行的扫描器」。

## 问题

调用大模型 API 的 AI 小程序，「能跑」和「能上线」之间隔着一条多环节合规链（深度合成类目、生成内容标识、域名规则、材料盖章），2025–2026 连续加码。单人无评审环境下，链条上任何一环的 ignorance 都直接变现为拒审、下架或约谈。见 [docs/issue-repro.md](docs/issue-repro.md)（Issue #1 复现：一个"看起来能跑"的 AI 问答小程序藏着 9 处违规）。

## 解法：合规即代码（compliance-as-code）

```bash
# 扫描小程序项目目录（blocker 存在时退出码 1，可直接做 CI 门禁）
node src/cli.mjs path/to/miniprogram --json report.json --md report.md
```

5 条规则，每条带稳定 ID、严重级、法条/平台依据、修复建议（`rules-meta.yaml`）：

| ID | 规则 | 级别 | 依据 |
|---|---|---|---|
| AIG01 | AI 生成内容显式标识（交互界面） | blocker | 《人工智能生成合成内容标识办法》第四条 |
| AIG02 | 复制/导出路径追加生成标识 | blocker | 《办法》第四条/第五条 |
| NET01 | 请求合法域名 HTTPS + 无明文回落 | blocker | 微信平台 request 域名规则 |
| REG01 | 深度合成类目提审材料齐备 | blocker | 深度合成类目要求（仅非个人主体） |
| BASE01 | 基础库版本门槛（云开发 AI ≥3.15.1） | warning | 微信开放文档 |

## 快速开始

```bash
npm test                                  # 8 项测试（含双 fixture 正反验证）
node src/cli.mjs fixture-app              # 违规示例：9 findings / 8 blocker / exit 1
node src/cli.mjs fixture-app-compliant    # 合规示例：全绿 / exit 0
```

## 设计源头

见 [docs/research-opensource.md](docs/research-opensource.md)：conftest/OPA（对结构化配置做策略断言）、checkov（检查项 ID + 严重级 + 修复建议的报告结构）、gitleaks/secretlint（无状态规则 + 上下文一次性构建 + 豁免机制）。

## 目录

```
src/cli.mjs            CLI（--json/--md 报告产物，退出码=门禁语义）
src/engine.mjs         引擎：构建上下文 → 跑规则 → 聚合 findings
src/rules/             5 条规则，无状态、可独立测试
src/yaml-lite.mjs      零依赖 YAML 子集解析器（规则元数据/材料清单）
src/report.mjs         console/JSON/markdown 三格式报告
rules-meta.yaml        规则元数据（ID/严重级/依据/修复）
fixture-app/           违规小程序（复现材料，Issue #1 现场）
fixture-app-compliant/ 合规小程序（修复后的成品示例）
tests/                 node:test 8 项
docs/                  开源调研 / 评审采纳记录 / 覆盖场景 / Issue 复现
```

## 声明

本工具覆盖的是「可静态检查」的合规子集；类目申请、盖章材料、备案周期等流程性环节由 `compliance/checklist.yaml` 跟踪（REG01 规则强制其状态就绪）。法规依据原文见 `rules-meta.yaml` 与问题报告 §3.2。

## 版本

- v0.1.0（2026-10-13）：5 规则引擎 + 双 fixture + CI。PR #2 合并记录见 GitHub。
