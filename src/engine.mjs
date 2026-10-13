/** 合规门禁引擎：加载目标小程序项目 → 跑全部规则 → 聚合 findings。
 *
 * 设计源头（docs/research-opensource.md）：
 * - conftest：对结构化配置（JSON/YAML）做策略断言，失败必须给出可读消息与位置
 * - checkov：每条检查有稳定 ID + 严重级 + 修复建议，报告 pass/fail 分组输出
 * - gitleaks/secretlint 的启发：规则无状态、上下文一次性构建、可独立测试
 */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { load as loadYaml } from "./yaml-lite.mjs";
import { RULES } from "./rules/index.mjs";

export async function buildContext(root) {
  const exists = async (rel) => {
    try {
      await readFile(join(root, rel), "utf8");
      return true;
    } catch {
      return false;
    }
  };
  const readJson = async (rel) => {
    try {
      return JSON.parse(await readFile(join(root, rel), "utf8"));
    } catch {
      return null;
    }
  };
  const walk = async (dir) => {
    const out = [];
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) out.push(...(await walk(p)));
      else out.push(p);
    }
    return out;
  };
  const files = await walk(root);
  const readText = {};
  for (const f of files) {
    if (/\.(js|wxml|json|yaml|wxs)$/i.test(f)) {
      readText[f] = await readFile(f, "utf8");
    }
  }

  // project.config.json：真实微信工具同时存在「平铺」与 miniprogram 嵌套两种形态
  // （对抗研究 Q2：知规模型把 urlCheck/libVersion 藏进嵌套层绕过检查）。
  // 解析失败（如 JSON 内 // 注释）不能静默当 null——那是所有配置类规则的全盲区。
  let projectConfig = null;
  let projectConfigError = null;
  if (await exists("project.config.json")) {
    const raw = await readJson("project.config.json");
    if (raw === null) {
      projectConfigError = "project.config.json 存在但 JSON 解析失败（注释/尾逗号等非法语法）";
    } else {
      const nested = raw.miniprogram ?? {};
      projectConfig = {
        ...raw,
        ...(nested && typeof nested === "object"
          ? { libVersion: raw.libVersion ?? nested.libVersion, setting: { ...nested.setting, ...raw.setting } }
          : {}),
      };
    }
  }

  let checklist = null;
  let checklistError = null;
  if (await exists("compliance/checklist.yaml")) {
    try {
      checklist = loadYaml(await readFile(join(root, "compliance", "checklist.yaml"), "utf8"));
    } catch (e) {
      checklistError = `compliance/checklist.yaml 无法解析：${e.message}`;
    }
  }
  return {
    root,
    appJson: await readJson("app.json"),
    projectConfig,
    projectConfigError,
    checklist,
    checklistError,
    files,
    readText,
  };
}

export async function runGate(root) {
  const ctx = await buildContext(root);
  const meta = loadYaml(await readFile(new URL("../rules-meta.yaml", import.meta.url), "utf8"));
  const metaById = Object.fromEntries(meta.rules.map((r) => [r.id, r]));

  const findings = [];
  for (const rule of RULES) {
    const passed = rule.check(ctx); // 返回 [] = 通过；否则 Finding[]
    findings.push(
      ...passed.map((f) => ({
        ruleId: rule.id,
        severity: metaById[rule.id].severity,
        name: metaById[rule.id].name,
        basis: metaById[rule.id].basis,
        fix: metaById[rule.id].fix,
        ...f,
      }))
    );
  }
  const passedRuleIds = RULES.filter((r) => !findings.some((f) => f.ruleId === r.id)).map((r) => r.id);
  const ruleNames = Object.fromEntries(meta.rules.map((r) => [r.id, r.name]));
  return { root, findings, passedRuleIds, ruleNames, blockers: findings.filter((f) => f.severity === "blocker").length };
}
