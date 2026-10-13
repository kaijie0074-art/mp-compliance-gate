# Q1 人工核读审计表（corpus-r1-blind，2026-10-14）

逐样本人工核对 manifest 自报 vs 实际代码（核读者：研究 agent；核读方法：逐文件读 code，判定真实违规）。
manifest 自报存在系统性虚报（见下），故以本表为准。

| 样本 | 真实 AIG01 违规(无标识展示 AI 结果) | 真实 AIG02 违规(剪贴板去标识) | 真实 NET01 违规 | 真实 REG01 违规 | 真实 BASE01 范围违规 | 门禁实际 fired |
|---|---|---|---|---|---|---|
| blind-01 | ✔（class="answer"，无标识） | ✘（无剪贴板调用） | ✘（无任何 http URL，manifest 谎报明文接口） | ✔（status 未就绪） | ✘（libVersion 2.14.0 低，但未用 wx.cloud.extend.AI，规则不适用） | REG01 |
| blind-02 | ✔（generic class，无标识） | ✘ | ✔（'http://api.ai.example.com/answer'）| ✔ | ✘（同上 2.8.2 未用云 AI） | NET01, REG01 |
| blind-03 | ✔ | ✘ | ✔（'http://example.com/api/answer'） | ✔ | ✘（libVersion 空且未用云 AI） | NET01, REG01 |
| blind-04 | ✔ | ✘ | ✔（http URL） | ✔ | ✘ | NET01, REG01 |
| blind-05 | ✔ | ✘ | ✔（http + urlCheck:false） | ✔ | ✘ | NET01, REG01 |
| blind-06 | ✔ | ✘ | ✔（'http://example.com/api/answer'） | ✔（checklist 顶层列表非 materials 键 → 结构性触发） | ✘ | NET01, REG01 |
| blind-07 | ✔ | ✘ | ✔（'http://example.com/api/answer'，行 13） | ✔（status pending） | ✘（无 libVersion 且未用云 AI） | NET01, REG01 |
| blind-08 | ✔ | ✘ | ✔（'http://example.com/ask'） | ✔（MTL001 pending） | ✘ | NET01, REG01 |
| blind-09 | ✔ | ✘ | ✔ | ✔ | ✘ | NET01, REG01 |
| blind-10 | ✘（模型未埋任何雷，manifest 空——生成失败样本） | ✘ | ✘ | ✔（checklist 未就绪） | ✘ | REG01 |
| blind-11 | ✔ | ✘ | ✔ | ✔ | ✘ | NET01, REG01 |
| blind-12 | ✔ | ✘ | ✘（代码是 https://example.com/api/ask，注释自称"明文HTTP"——模型想埋 http 却写成 https，埋雷失败） | ✔ | ✘（2.10.0 未用云 AI） | REG01 |

## 汇总（人工核读口径）

- **AIG01：真实违规 11/12 样本，检出 0 → 召回 0%。** wxml 全部用 generic class（container/answer/answers），AI_PAGE_HINTS 词表全不命中；无一处有「内容由 AI 生成」文案。
- AIG02：真实违规 0（全语料无 wx.setClipboardData 调用）→ 规则无对象；manifest 自报 7 处全为虚报。
- NET01：真实违规 10，检出 10 → 召回 100%。2 处自报未命中是模型埋雷失败（写成 https / 没写 URL），非门禁漏报。
- REG01：真实违规 12（blind-10 也有），检出 12 → 召回 100%（其中 blind-06 是"materials 键缺失"的结构性触发，消息文案不准确但 blocker 正确）。
- BASE01：全语料无 wx.cloud.extend.AI 使用 → 规则触发条件不满足（范围外），低 libVersion 的自报违规全部不在规则守卫路径上。
- 样本级逃逸：0/11（每个样本都伴随 NET01/REG01 粗违规被拦）——**拦截由粗错误驱动，语义级违规（AI 内容不标识）100% 逃逸**。

## 结构性发现（供 Q3 补规则）

1. **AIG01 词表检测的查全天花板**：盲生成的自然 wxml 命名（answer/answers/result）天然规避 ai-* 词表——不是对抗，是词表本身覆盖不足。
2. **project.config.json 嵌套变体**：blind-02 把全部配置嵌在 `"miniprogram"` 键下（真实微信工具也会生成 `miniprogram` 嵌套结构），urlCheck:false 未被 NET01 检出（本样本因 http URL 与 checklist 被拦，但 urlCheck 项漏检）。
3. **manifest 自报不可信**：虚报（AIG02 7 处、BASE01 12 处范围外）+ 漏报 + 埋雷失败（blind-12 https 冒充 http）。ground truth 必须人工核读。
4. **BASE01 守卫范围**：只守 wx.cloud.extend.AI 路径；自有 HTTPS 域名直连 LLM API 的 AI 功能完全在 AIG01/BASE01 语义范围外（AIG01 靠词表、BASE01 靠云 API 特征）。
