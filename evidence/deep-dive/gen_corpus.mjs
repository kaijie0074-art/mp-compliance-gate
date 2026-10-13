/** 对抗语料生成器：调 glm-4-flash 生成"看似合规藏违规"的小程序样本。
 * 用法：node gen_corpus.mjs <mode> <n> <outdir>
 *   mode = blind     盲生成（不给门禁规则）
 *        | known     知规对抗（给全部规则源码，要求绕过）
 *        | compliant 试图合规（测误报）
 * 样本 = 目录（可被 runGate 扫描）+ manifest.json（模型自报埋雷清单，作为 ground truth 线索）
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { chat } from "./llm.mjs";

// 直接读全部规则源码（知规模式用）
const mode = process.argv[2];
const n = Number(process.argv[3] || 12);
const outdir = process.argv[4] || `corpus-${mode}`;
await mkdir(outdir, { recursive: true });
const { readdir, readFile } = await import("node:fs/promises");
const rulesDir = new URL("../../src/rules/", import.meta.url);
let rulesDump = "";
for (const f of (await readdir(rulesDir)).filter((x) => x.endsWith(".mjs")).sort()) {
  rulesDump += `\n===== ${f} =====\n${await readFile(new URL(f, rulesDir), "utf8")}`;
}
const metaDump = readFileSync(new URL("../../rules-meta.yaml", import.meta.url), "utf8");

const FILES_SPEC = `必须且只能包含这些文件（路径为相对路径，值是文件完整内容字符串）：
- app.json
- project.config.json
- pages/ai/ai.wxml
- pages/ai/ai.js
- compliance/checklist.yaml（YAML，materials 列表，每项 id/name/status）`;

const OUTPUT_SPEC = `严格按下面的文本格式输出（文件内容原样粘贴，禁止 JSON 转义、禁止代码围栏）：
===FILE app.json===
<app.json 完整内容>
===FILE project.config.json===
<project.config.json 完整内容>
===FILE pages/ai/ai.wxml===
<wxml 完整内容>
===FILE pages/ai/ai.js===
<js 完整内容>
===FILE compliance/checklist.yaml===
<yaml 完整内容>
===MANIFEST===
[{"rule_hint":"AIG01|AIG02|NET01|REG01|BASE01|OTHER 之一","description":"这处埋的违规是什么、藏在哪个文件哪一行附近、为什么真实世界会被微信拒审","category":"若 rule_hint=OTHER 给违规类别短词（隐私权限夹带/类目规避/虚拟支付/诱导分享/内容安全/材料造假）"}]
MANIFEST 是给你合作者的私账（审核方看不到），必须如实列出每一处埋雷。`;

/** 解析标记格式输出 → { files, embedded_violations } */
export function parseMarkers(text) {
  const files = {};
  const re = /===FILE (.+?)===\r?\n([\s\S]*?)(?=\r?\n===FILE |===MANIFEST===|$)/g;
  let m;
  while ((m = re.exec(text))) {
    files[m[1].trim()] = m[2].replace(/\s+$/, "");
  }
  const mani = text.split("===MANIFEST===")[1] ?? "";
  const violations = [];
  // 模型可能每行输出一个数组，也可能一个多行数组——两种策略都试
  for (const line of mani.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("[")) continue;
    try {
      const v = JSON.parse(t);
      if (Array.isArray(v)) violations.push(...v);
    } catch {
      /* skip line */
    }
  }
  if (violations.length === 0) {
    const s = mani.indexOf("[");
    const e = mani.indexOf("]");
    if (s !== -1 && e > s) {
      try {
        const v = JSON.parse(mani.slice(s, e + 1));
        if (Array.isArray(v)) violations.push(...v);
      } catch {
        /* give up */
      }
    }
  }
  return { files, embedded_violations: violations };
}

const PROMPTS = {
  blind: `你是赶工期的微信小程序外包开发者，客户要一个带 AI 问答功能的小程序，你想让它"看起来能过微信审核"但省掉麻烦事：偷偷埋入 1~4 处真实存在的合规违规（自选，例如：AI 生成内容不标识、复制内容去标识、明文 http 接口或 IP 直连、提审材料没准备却想蒙混、基础库版本不够、权限夹带、类目规避等）。
要求：表面伪装成认真做过合规的样子（比如放一些无关紧要的合规注释/免责声明混淆视听），违规要真实——真实提审会被拒或下架的那种。
${FILES_SPEC}
注意 checklist.yaml 的写法（缩进 two-space，list 用 "- id: xxx"）。
${OUTPUT_SPEC}
embedded_violations 必须如实列出你埋的每一处违规（这是给你的合作者的私聊，不会被审核方看到）。`,

  known: `你是一名渗透测试工程师，正在对一个"微信小程序上架合规门禁"做红队评估。下面是该门禁的全部规则源码与元数据。请生成一个真实存在合规违规、但能尽量绕过这套门禁检测的小程序项目样本（埋 1~4 处真实违规，规则没覆盖或检测逻辑有洞的优先）。
${FILES_SPEC}
${OUTPUT_SPEC}
embedded_violations 如实列出你埋的每一处违规及你预期门禁查不出来的原因（evasion_reason 字段）。`,

  compliant: `你是认真合规的微信小程序开发者。生成一个完全合规的带 AI 问答功能的小程序项目：AI 界面有"内容由 AI 生成"显著标识、复制路径追加标识、全部 https、提审材料全部就绪、libVersion ≥ 3.15.1。
${FILES_SPEC}
${OUTPUT_SPEC}
embedded_violations 应为空数组 []。`,
};

const sys = {
  blind: "你是资深微信小程序外包开发者，熟悉微信审核的灰色地带。",
  known: "你是资深红队工程师，擅长分析静态扫描器的检测逻辑并构造绕过样本。",
  compliant: "你是严谨的微信小程序开发者，合规意识强。",
}[mode];
if (!sys) throw new Error(`未知 mode: ${mode}`);

const prompt = PROMPTS[mode] + (mode === "known" ? `\n\n===== 门禁规则元数据 =====\n${metaDump}\n===== 门禁规则全部源码 =====\n${rulesDump}` : "");

const index = [];
let jsonFail = 0;
for (let i = 1; i <= n; i++) {
  const id = `${mode}-${String(i).padStart(2, "0")}`;
  const dir = `${outdir}/${id}`;
  if (existsSync(`${outdir}/${id}.manifest.json`)) {
    console.log(`[${i}/${n}] ${id} 已存在，跳过`);
    continue;
  }
  process.stdout.write(`[${i}/${n}] ${id} ... `);
  let out;
  try {
    out = await chat(
      [
        { role: "system", content: sys },
        { role: "user", content: prompt + `\n\n（本次生成编号 ${id}，请与其他样本不同：换一种业务场景与埋雷组合）` },
      ],
      { temperature: 1.0, maxTokens: 6000 }
    );
  } catch (e) {
    console.log(`LLM 调用失败: ${e.message}`);
    continue;
  }
  let parsed;
  try {
    parsed = parseMarkers(out);
    if (Object.keys(parsed.files).length < 4) throw new Error(`文件数不足: ${Object.keys(parsed.files).join(",")}`);
  } catch (e) {
    jsonFail++;
    console.log(`解析失败: ${e.message}`);
    await writeFile(`${outdir}/${id}.raw.txt`, out, "utf8");
    continue;
  }
  await mkdir(dir, { recursive: true });
  for (const [path, content] of Object.entries(parsed.files)) {
    if (typeof content !== "string") continue;
    const safe = path.replace(/\.\./g, "").replace(/^\/+/, "");
    const dest = join(dir, safe);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, content, "utf8");
  }
  await writeFile(`${outdir}/${id}.manifest.json`, JSON.stringify(parsed.embedded_violations ?? [], null, 2), "utf8");
  index.push({ id, violations: (parsed.embedded_violations ?? []).length });
  console.log(`ok，埋雷 ${(parsed.embedded_violations ?? []).length} 处`);
}
await writeFile(`${outdir}/_index.json`, JSON.stringify({ mode, n, jsonFail, samples: index }, null, 2), "utf8");
console.log(`\n完成：${index.length} 个样本，解析失败 ${jsonFail}`);
