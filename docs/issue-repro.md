# Issue #1 复现材料：一个「看起来能跑」的 AI 小程序藏着 9 处违规

## 现场

`fixture-app/`：功能完整的 AI 问答小程序（云开发大模型直调 + 流式渲染 + 复制分享），
模拟器里一切正常。提审前无任何检查流程——单人岗位的默认状态。

## 复现步骤

```bash
node src/cli.mjs fixture-app; echo "exit=$?"
```

预期输出：**9 findings（8 blocker + 1 warning），exit=1**。

## 违规清单（对照平台后果）

| 位置 | 违规 | 后果（提审/运行时） |
|---|---|---|
| pages/ai/ai.wxml | AIG01 界面无「AI 生成」显著提示 | 违反《标识办法》第四条；类目审核要求标识样式截图，拿不出 |
| pages/ai/ai.js L28 | AIG02 setClipboardData 未追加标识 | 复制即脱标识传播，违反第四条/第五条 |
| pages/ai/ai.js L36 | NET01 http:// 明文 IP 直连 | 合法域名校验直接失败，request 全挂 |
| project.config.json | NET01 urlCheck=false | 开发时绕过校验=提审时集中爆雷 |
| compliance/checklist.yaml | REG01 四份材料 pending/missing | 深度合成类目无备案材料=拒审；盖章走行政流程以周计，day 1 不发起必卡死周期 |
| project.config.json | BASE01 libVersion 2.30.0 < 3.15.1 | wx.cloud.extend.AI 低版本真机报错，模拟器不报——上线后才炸 |

## 根因

合规链没有进入工程流程：它是「知识」而非「检查」，而单人无评审岗位的知识全靠
记忆——记忆会漏，拒审不会讲情面。

## 修复

PR #2：合规门禁引擎（5 规则 + 报告 + CI 门禁语义）。修复后的对照成品：
`fixture-app-compliant/`（同功能，9→0 违规，exit=0）。
