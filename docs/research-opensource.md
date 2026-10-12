# 开源项目调研笔记（T2 · 合规门禁）

> 调研时间：2026-10-13。项目均经独立检索核实。本文档是设计决策的思考源头。

## 1. conftest（open-policy-agent/conftest）

- 仓库：https://github.com/open-policy-agent/conftest
- 定位：用 Open Policy Agent 的 Rego 语言对结构化配置（JSON/YAML/TOML…）写策略测试。
- 核心机制：`conftest test file.json --policy policy/` → 每条 Rego 规则 deny 即失败，
  失败消息带文件与行定位；支持 `--output json`。
- **借鉴点**：「对配置文件断言策略」正是 AIG/BASE/NET 规则的形态。
- **背离点**：Rego 是新语言，学习曲线对 2-4 周单人项目不划算（T2 问题报告 §3.3
  的周期约束）。本仓库用「无状态 JS 函数 + 声明式元数据 YAML」达到同等效果：
  策略可读、可测、零新语言。**这个取舍本身就是问题报告的结论之一**。

## 2. checkov（bridgecrewio/checkov）

- 仓库：https://github.com/bridgecrewio/checkov
- 定位：IaC 静态扫描器（Terraform/K8s/云…），按检查项 ID 输出 pass/fail。
- 核心机制：每个检查有稳定 ID（`CKV_AWS_*`）、严重级、修复指引；报告按
  「passed checks / failed checks」分组；CI 退出码即门禁。
- **借鉴点**：`rules-meta.yaml` 的结构（ID/严重级/依据/修复）与本仓库报告的
  pass/fail 分组、退出码语义（0=可提审，1=有 blocker）直接对标 checkov 的
  报告模型。finding 必须带「依据条款」来自 checkov 的 "how to fix" 惯例——
  没有出处的合规检查等于没有。

## 3. gitleaks（gitleaks/gitleaks）与 secretlint

- 仓库：https://github.com/gitleaks/gitleaks
- 核心机制：正则规则文件 + 允许行内豁免注释（`# gitleaks:allow`）+ 基线文件
  （已知豁免清单，供渐进式修复）。
- **借鉴点**：无状态规则、上下文一次性构建（`buildContext` 读全量文件后分发）、
  「扫描器不猜意图只报模式命中」的克制。豁免机制本仓库暂不需要（规则只有 5 条、
  无存量豁免场景），登记为规则数增长后的必要演进。

## 4. miniprogram-ci（微信官方）

- npm：https://www.npmjs.com/package/miniprogram-ci
- 官方文档：https://developers.weixin.qq.com/miniprogram/dev/devtools/ci
- 核心机制：微信开发者工具的编译模块抽离（上传/预览/编译），需代码上传密钥
  （privateKey 文件）+ IP 白名单。
- **借鉴点与边界**：T3 仓库用它做编译反馈闭环；本仓库的定位是「提审前的合规
  门禁」，与 miniprogram-ci 的「构建流水线」互补——合规门禁先于构建（材料
  未齐不进构建队列）。密钥与白名单要求决定了开源 CI 里只能演示降级模式，
  详见 T3 仓库说明。

## 5. 机制对照表

| 本仓库组件 | 思想源头 | 差异 |
|---|---|---|
| rules-meta.yaml（ID/严重级/依据/修复） | checkov 检查项结构 | 依据字段是法规条款而非云最佳实践 |
| 引擎 buildContext → 规则函数 | gitleaks/secretlint | 上下文含小程序特有物（libVersion/checklist） |
| 退出码 = CI 门禁语义 | conftest/checkov | 0/1/2 三态（2=IO 错误不背门禁锅） |
| JSON/markdown 报告产物 | conftest --output | markdown 面向人工归档（提审记录留痕） |
| yaml-lite 零依赖解析 | — | 只解析仓库所需子集，YAGNI 边界显式声明 |

## 未采纳的候选

- **OPA/Rego 本体**：新语言学习成本 vs 5 条规则的收益，不成立（周期约束下）。
- **ESLint plugin 形态**：合规对象是「项目配置 + WXML + 流程状态」，不是纯 JS
  代码风格，lint 的错误模型（源码位置）不适配 REG01 这类流程规则。ESLint
  形态的废弃 API 门禁在 T3 仓库（那边才是它的正确战场）。
