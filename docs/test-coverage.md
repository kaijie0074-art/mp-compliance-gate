# 测试覆盖场景说明（T2）

## 场景矩阵

| # | 场景 | 期望行为 | 测试 |
|---|---|---|---|
| S1 | 界面标识缺失（AI 页面无提示文案） | AIG01 blocker 命中并指出文件 | `违规 fixture：5 条规则全部命中` |
| S2 | 复制路径无标识追加 | AIG02 blocker 命中并指出行号 | 同上 |
| S3 | http 明文 / 裸 IP 直连 | NET01 blocker 命中并列出地址 | 同上 |
| S4 | urlCheck=false 绕过域名校验 | NET01 blocker 命中（独立 finding） | 同上 |
| S5 | 提审材料 pending/missing | REG01 每份未就绪材料一条 finding | 同上 |
| S6 | checklist.yaml 文件缺失 | REG01 报「清单缺失」（材料无人跟踪） | REG01 规则代码分支 |
| S7 | libVersion < 3.15.1 且用云开发 AI | BASE01 warning 命中 | S1 测试 + BASE01 代码 |
| S8 | 未用云开发 AI 的普通小程序 | BASE01 不误报（门槛不适用） | BASE01 代码分支（usesCloudAI 前置） |
| S9 | 合规项目（全部修复后） | 0 findings、5 规则全过、exit=0 | `合规 fixture：0 违规` |
| S10 | blocker 存在时退出码=1 | CI 门禁语义成立 | `blocker 数与退出码` |
| S11 | --json 报告机器可读、finding 字段齐全 | 依据+修复建议不缺项 | `报告产物：--json/--md` |
| S12 | --md 报告含规则 ID 与级别 | 人工归档可读 | 同上 |
| S13 | 规则元数据完整性 | 每条规则 ID/严重级/依据/修复四要素 | `规则元数据` 测试 |
| S14 | YAML 解析：列表项首键不丢失 | rules[].id 不为 undefined（回归） | `yaml-lite：list-of-mapping 首键不丢失` |
| S15 | YAML 标量类型 | 数字/布尔/引号串/行内注释 | `yaml-lite：标量类型` |
| S16 | checklist 状态语义 | ready/pending/missing 区分 | `yaml-lite：checklist 形态` |

## 判据对应（问题报告 §3.5 提审 checklist）

1. 类目/材料/标识/域名四要素全绿才可提审 → S1-S5、S9（blocker 清零语义）
2. 检查可重复、可归档 → S11-S12（JSON+md 报告产物）
3. 拒审应对的证据链 → md 报告作为提审记录留痕

## 已知局限

- AIG01/AIG02 是模式启发式：极简写法（自定义组件包裹、动态拼 class）可能漏检；
  规则数增长后应引入 gitleaks 式行内豁免注释与基线文件。
- REG01 只能验证「清单状态」，无法验证「材料真伪」——材料盖章依赖行政流程。
- NET01 不校验域名是否真实备案（无公开 API 可查），只做格式与明文回落检查；
  备案真实性由 checklist 的域名备案材料项跟踪。
