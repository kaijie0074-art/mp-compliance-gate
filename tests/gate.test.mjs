/** 门禁主测试：违规 fixture 全命中 + 合规 fixture 全绿 + 报告三格式 + 退出码。 */
import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runGate } from "../src/engine.mjs";

const run = promisify(execFile);
const ROOT = new URL("..", import.meta.url).pathname;

test("违规 fixture：5 条规则全部命中（复现 Issue #1 的 9 处违规）", async () => {
  const { findings } = await runGate(join(ROOT, "fixture-app"));
  const byRule = {};
  for (const f of findings) byRule[f.ruleId] = (byRule[f.ruleId] ?? 0) + 1;
  assert.equal(byRule.AIG01, 1, "界面标识缺失应命中");
  assert.equal(byRule.AIG02, 1, "复制路径标识缺失应命中");
  assert.equal(byRule.NET01, 2, "明文地址 + urlCheck=false 应命中");
  assert.equal(byRule.REG01, 4, "4 份材料未就绪应命中");
  assert.equal(byRule.BASE01, 1, "基础库版本不足应命中");
  assert.equal(findings.length, 9);
});

test("违规 fixture：blocker 数与退出码 = CI 门禁语义", async () => {
  const { blockers } = await runGate(join(ROOT, "fixture-app"));
  assert.equal(blockers, 8); // BASE01 为 warning
  const { code } = await run("node", [join(ROOT, "src/cli.mjs"), join(ROOT, "fixture-app")]).catch((e) => e);
  assert.equal(code, 1, "存在 blocker 时退出码必须为 1");
});

test("合规 fixture：0 违规，5 规则全过", async () => {
  const { findings, passedRuleIds, blockers } = await runGate(join(ROOT, "fixture-app-compliant"));
  assert.equal(findings.length, 0, JSON.stringify(findings, null, 2));
  assert.equal(passedRuleIds.length, 5);
  assert.equal(blockers, 0);
});

test("报告产物：--json/--md 落盘且字段完整", async () => {
  const { code } = await run("node", [
    join(ROOT, "src/cli.mjs"), join(ROOT, "fixture-app"),
    "--json", join(ROOT, "tmp-report.json"), "--md", join(ROOT, "tmp-report.md"),
  ]).catch((e) => e);
  assert.equal(code, 1);
  const { readFile, rm } = await import("node:fs/promises");
  const json = JSON.parse(await readFile(join(ROOT, "tmp-report.json"), "utf8"));
  assert.ok(json.blockers >= 1 && json.findings.length === 9);
  for (const f of json.findings) {
    assert.ok(f.ruleId && f.severity && f.name && f.basis && f.fix && f.file && f.detail, "finding 字段必须齐全（法条依据+修复建议）");
  }
  const md = await readFile(join(ROOT, "tmp-report.md"), "utf8");
  assert.ok(md.includes("blocker") && md.includes("AIG01") && md.includes("REG01"));
  await rm(join(ROOT, "tmp-report.json"));
  await rm(join(ROOT, "tmp-report.md"));
});

test("规则元数据：每条规则都有 ID/严重级/依据/修复建议（checkov 式结构完整性）", async () => {
  const { readFile } = await import("node:fs/promises");
  const { load } = await import("../src/yaml-lite.mjs");
  const meta = load(await readFile(join(ROOT, "rules-meta.yaml"), "utf8"));
  assert.equal(meta.rules.length, 5);
  for (const r of meta.rules) {
    assert.ok(r.id && r.severity && r.basis && r.fix && r.name, `${r.id} 元数据不完整`);
    assert.ok(["blocker", "warning"].includes(r.severity));
  }
});
