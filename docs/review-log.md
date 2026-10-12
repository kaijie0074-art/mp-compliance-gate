# 评审采纳记录（PR #2）

> 评审者：虚拟评审者（小程序方向人设，岗位演练设定）。意见原文见 PR #2 review。

| # | 意见 | 严重度 | 处置 | 证据 |
|---|---|---|---|---|
| OB-1 | BASE01 对 `libVersion: "latest"/"trial"` 非语义化值误判为 0.0.0 | major | **采纳**。非语义化版本 → 「无法机械比较，需人工确认」finding，绝不输出错误的确定结论。 | `BASE01-sdk-version.mjs` + `BASE01：libVersion=latest` 等 3 项测试 |
| OB-2 | AIG02 的 7 行窗口对变量引用 data 无法确认 | major | **采纳（方向修正后）**。实测方向是误报而非漏报（窗口内无标识痕迹一律报），已让文案区分「data 表达式未见 → 需人工确认」；局限登记 docs/test-coverage.md | `AIG02-clipboard-label.mjs` 分支 + 2 项测试 |
| OB-3 | 自制 yaml-lite 的静默吞错风险 | question | **采纳并加固**。实测发现流式集合 `[1,2,3]` 被静默解析为字符串——加显式 throw；越界语法 fail loudly 以测试锁定 | `yaml-lite.mjs` scalar() + `越界语法必须 fail loudly` 测试 |
| OB-4 | 全绿时报告只一行 | minor | **采纳**。列出通过的 5 条规则 ID+名称（console/markdown 同步） | `report.mjs` + CLI 实测输出 |

## 修复验证

- 评审前：8/8（含 2 个评审实测复现的缺陷：BASE01 latest 误判、yaml 流式集合吞错）
- 评审后：**15/15**（+7 评审驱动测试）

## 流程说明

OB-2 的意见方向在作者复测中被纠正（漏检→误报）——评审意见本身也应被验证，
这是双向质询的意义：意见采纳不是服从，是复现→修正→再采纳。
