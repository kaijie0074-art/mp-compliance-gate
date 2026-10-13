/** 对抗研究加固回归（deep-dive 2026-10-14，Q2/Q3 发现的绕过路径逐条锁死）。
 * 每个用例都来自真实 glm-4-flash 对抗样本（evidence/deep-dive/corpus-*）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runGate } from "../src/engine.mjs";
import { load as loadYaml } from "../src/yaml-lite.mjs";

async function scaffold(files) {
  const root = await mkdtemp(join(tmpdir(), "adv-"));
  for (const [rel, content] of Object.entries(files)) {
    await mkdir(join(root, rel, ".."), { recursive: true });
    await writeFile(join(root, rel), content, "utf8");
  }
  return root;
}
const ids = (findings) => [...new Set(findings.map((f) => f.ruleId))];

test("yaml-lite：标准 YAML 同缩进列表（key 下一级 list 与 key 同缩进）可解析", () => {
  const doc = `materials:
- id: a
  name: 甲
  status: ready
- id: b
  name: 乙
  status: pending
other: 1
`;
  const v = loadYaml(doc);
  assert.deepEqual(v.materials.map((m) => m.id), ["a", "b"]);
  assert.equal(v.other, 1);
});

test("yaml-lite：顶层 mapping 后游离 list 行仍显式报错（不静默丢弃）", () => {
  assert.throws(() => loadYaml("a: 1\n- b\n"), /YAML 语法错误/);
});

test("NET01：urlCheck=false 藏进 miniprogram 嵌套层仍被检出（corpus-r2-known/known-03 手法）", async () => {
  const root = await scaffold({
    "project.config.json": JSON.stringify({ miniprogram: { setting: { urlCheck: false } } }),
    "compliance/checklist.yaml": "materials:\n- id: x\n  name: x\n  status: ready\n",
  });
  const { findings } = await runGate(root);
  assert.ok(ids(findings).includes("NET01"), JSON.stringify(findings));
  assert.ok(findings.some((f) => f.ruleId === "NET01" && f.detail.includes("urlCheck=false")));
  await rm(root, { recursive: true });
});

test("NET01/BASE01：project.config.json 含非法 JSON（// 注释）→ 显式人工确认，不再静默全盲（known-03 手法）", async () => {
  const root = await scaffold({
    "project.config.json": '{\n  "setting": { "urlCheck": false } // 注释\n}\n',
    "pages/ai/ai.js": "Page({ f(){ const ai = wx.cloud.extend.AI; } })",
    "compliance/checklist.yaml": "materials:\n- id: x\n  name: x\n  status: ready\n",
  });
  const { findings } = await runGate(root);
  assert.ok(findings.some((f) => f.ruleId === "NET01" && f.detail.includes("JSON 解析失败")));
  assert.ok(findings.some((f) => f.ruleId === "BASE01" && f.detail.includes("无法机械确认")));
  await rm(root, { recursive: true });
});

test("BASE01：libVersion 嵌套在 miniprogram 层仍参与门槛比较", async () => {
  const root = await scaffold({
    "project.config.json": JSON.stringify({ miniprogram: { libVersion: "3.15.0" } }),
    "pages/ai/ai.js": "Page({ f(){ const ai = wx.cloud.extend.AI; } })",
    "compliance/checklist.yaml": "materials:\n- id: x\n  name: x\n  status: ready\n",
  });
  const { findings } = await runGate(root);
  assert.ok(findings.some((f) => f.ruleId === "BASE01" && f.detail.includes("低于云开发 AI 门槛")));
  await rm(root, { recursive: true });
});

test("REG01：checklist 存在但解析失败 → 报「无法机械确认」而非「缺少清单文件」（known-08 手法）", async () => {
  const root = await scaffold({
    "compliance/checklist.yaml": "materials:\n- id: x\n  name: x\n  status: ready\n```\n",
  });
  const { findings } = await runGate(root);
  assert.ok(findings.some((f) => f.ruleId === "REG01" && f.detail.includes("无法解析")));
  assert.ok(!findings.some((f) => f.ruleId === "REG01" && f.detail.includes("缺少提审材料清单文件")));
  await rm(root, { recursive: true });
});

test("AIG01：generic class 页面（无 ai-* 词）按页映射结构判定检出（corpus-r1-blind 11/11 手法）", async () => {
  const root = await scaffold({
    "app.json": JSON.stringify({ pages: ["pages/ai/ai"], window: { navigationBarTitleText: "AI问答" } }),
    "pages/ai/ai.js": "Page({ async ask(){ const r = await wx.request({ url: 'https://api.example.com/answer' }); } });",
    "pages/ai/ai.wxml": '<view class="container"><view class="answer">{{answer}}</view></view>',
    "project.config.json": JSON.stringify({ setting: { urlCheck: true } }),
    "compliance/checklist.yaml": "materials:\n- id: x\n  name: x\n  status: ready\n",
  });
  const { findings } = await runGate(root);
  assert.ok(findings.some((f) => f.ruleId === "AIG01" && f.detail.includes("结构判定")), JSON.stringify(findings));
  await rm(root, { recursive: true });
});

test("AIG01：结构判定不误伤——同页有「内容由 AI 生成」标识则通过", async () => {
  const root = await scaffold({
    "app.json": JSON.stringify({ pages: ["pages/ai/ai"] }),
    "pages/ai/ai.js": "Page({});",
    "pages/ai/ai.wxml": '<view class="answer">内容由 AI 生成，仅供参考</view>',
    "project.config.json": JSON.stringify({ setting: { urlCheck: true } }),
    "compliance/checklist.yaml": "materials:\n- id: x\n  name: x\n  status: ready\n",
  });
  const { findings } = await runGate(root);
  assert.ok(!ids(findings).includes("AIG01"), JSON.stringify(findings));
  await rm(root, { recursive: true });
});

test("AIG01：app.json 结构异常（pages 非数组）→ 显式人工确认（corpus-r1-blind/blind-07 手法）", async () => {
  const root = await scaffold({
    "app.json": '[{"pages":"pages/ai/ai"}]',
    "pages/ai/ai.wxml": '<view class="answer">{{answer}}</view>',
    "compliance/checklist.yaml": "materials:\n- id: x\n  name: x\n  status: ready\n",
  });
  const { findings } = await runGate(root);
  assert.ok(findings.some((f) => f.ruleId === "AIG01" && f.detail.includes("pages 字段非数组")));
  await rm(root, { recursive: true });
});

test("AIG02：标识变量只出现在 success 回调（诱饵）→ 仍报 finding（窗口假通过收紧）", async () => {
  const root = await scaffold({
    "pages/ai/ai.js": `Page({
  copy() {
    wx.setClipboardData({
      data: this.data.answer,
      success: () => { const AI_LABEL = "x"; console.log(AI_LABEL); }
    });
  }
});`,
    "compliance/checklist.yaml": "materials:\n- id: x\n  name: x\n  status: ready\n",
  });
  const { findings } = await runGate(root);
  assert.ok(findings.some((f) => f.ruleId === "AIG02" && f.detail.includes("data 表达式")), JSON.stringify(findings));
  await rm(root, { recursive: true });
});

test("AIG02：标识文案变体（人工智能生成内容 / AI generated content）在 data 表达式内 → 通过（known-12/known-03 手法）", async () => {
  for (const label of ["人工智能生成内容，仅供参考。", "AI generated content, for reference only."]) {
    const root = await scaffold({
      "pages/ai/ai.js": `Page({ copy() { wx.setClipboardData({ data: '${label}' }); } });`,
      "compliance/checklist.yaml": "materials:\n- id: x\n  name: x\n  status: ready\n",
    });
    const { findings } = await runGate(root);
    assert.ok(!ids(findings).includes("AIG02"), `${label}: ${JSON.stringify(findings)}`);
    await rm(root, { recursive: true });
  }
});

test("REG01：就绪状态同义词（Checked/Completed/passed/compliant/已就绪）不误报（corpus-r5 手法）", async () => {
  const root = await scaffold({
    "compliance/checklist.yaml": `materials:
  - id: a
    name: 营业执照
    status: Checked
  - id: b
    name: 备案文件
    status: compliant
  - id: c
    name: 截图
    status: 已就绪
`,
  });
  const { findings } = await runGate(root);
  assert.ok(!ids(findings).includes("REG01"), JSON.stringify(findings));
  await rm(root, { recursive: true });
});
