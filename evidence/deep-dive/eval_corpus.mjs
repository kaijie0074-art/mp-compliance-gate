/** 语料评测器（离线）：对每个样本目录跑 runGate，与 manifest 对比计算检出/逃逸/盲区。
 * 用法：node eval_corpus.mjs <corpusDir> <resultJson>
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { runGate } from "../../src/engine.mjs";

const KNOWN = ["AIG01", "AIG02", "NET01", "REG01", "BASE01"];
const BLOCKER_RULES = ["AIG01", "AIG02", "NET01", "REG01"]; // BASE01 = warning

const corpusDir = process.argv[2];
const resultPath = process.argv[3] || join(corpusDir, "_eval.json");

const entries = (await readdir(corpusDir, { withFileTypes: true })).filter((e) => e.isDirectory());
const rows = [];
const perRule = Object.fromEntries(KNOWN.map((r) => [r, { embedded: 0, caught: 0 }]));
const otherCategories = {};
for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
  const dir = join(corpusDir, e.name);
  let manifest = [];
  try {
    manifest = JSON.parse(await readFile(`${corpusDir}/${e.name}.manifest.json`, "utf8"));
  } catch {
    manifest = [];
  }
  const gate = await runGate(dir);
  const fired = [...new Set(gate.findings.map((f) => f.ruleId))];
  const firedBlockers = gate.findings.filter((f) => f.severity === "blocker").map((f) => f.ruleId);

  // manifest 归一化：模型常把多个 hint 塞进一条（"AIG01|NET01"），拆开计
  const hints = [];
  for (const v of manifest) {
    const parts = String(v.rule_hint ?? "")
      .split(/[|,，/、\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => KNOWN.includes(s));
    if (parts.length > 0) for (const p of parts) hints.push({ ...v, rule_hint: p });
    else hints.push({ ...v, rule_hint: "OTHER" });
  }
  const blockerHints = hints.filter((v) => BLOCKER_RULES.includes(v.rule_hint));
  const baseHints = hints.filter((v) => v.rule_hint === "BASE01");
  const otherHints = hints.filter((v) => v.rule_hint === "OTHER");

  // 违规级召回：模型自报埋了规则 R 的雷 → 门禁是否真的报了 R
  for (const v of hints) {
    if (KNOWN.includes(v.rule_hint)) {
      perRule[v.rule_hint].embedded++;
      if (fired.includes(v.rule_hint)) perRule[v.rule_hint].caught++;
    } else {
      const cat = v.category || "未分类";
      otherCategories[cat] = (otherCategories[cat] || 0) + 1;
    }
  }

  // 样本级逃逸：埋了 blocker 级违规但门禁 0 blocker（BASE01 只算 warning 不构成逃逸）
  const escaped = blockerHints.length > 0 && firedBlockers.length === 0;
  // 全逃逸：任何规则（含 warning）都没报
  const fullyEscaped = manifest.length > 0 && gate.findings.length === 0;

  rows.push({
    id: e.name,
    embedded: manifest.length,
    manifest,
    hints: hints.map((h) => ({ rule_hint: h.rule_hint, category: h.category })),
    firedRules: fired,
    blockers: gate.blockers,
    findings: gate.findings.map((f) => ({ ruleId: f.ruleId, severity: f.severity, file: f.file, detail: f.detail })),
    blockerHints: blockerHints.length,
    escaped,
    fullyEscaped,
  });
}

const adversarial = rows.filter((r) => r.embedded > 0);
const summary = {
  corpus: corpusDir,
  samples: rows.length,
  adversarial: adversarial.length,
  escapedSamples: adversarial.filter((r) => r.escaped).length,
  fullyEscapedSamples: adversarial.filter((r) => r.fullyEscaped).length,
  perRule,
  otherCategories,
};
await writeFile(resultPath, JSON.stringify({ summary, rows }, null, 2), "utf8");

console.log(JSON.stringify(summary, null, 2));
