/** 报告渲染：console（人读，checkov 式 pass/fail 分组）+ JSON（机器读）+ markdown（归档）。 */
const SEV_MARK = { blocker: "✖", warning: "▲" };

export function renderConsole({ root, findings, passedRuleIds, blockers }) {
  console.log(`\n=== 提审合规门禁 · ${root} ===`);
  if (findings.length === 0) {
    console.log("✔ 全部规则通过，可发起提审。\n");
    return;
  }
  for (const f of findings) {
    console.log(`${SEV_MARK[f.severity]} [${f.ruleId}] ${f.name}`);
    console.log(`    ${f.file}`);
    console.log(`    ${f.detail}`);
    console.log(`    依据: ${f.basis}`);
    console.log(`    修复: ${f.fix}\n`);
  }
  if (passedRuleIds.length) {
    console.log(`✔ 通过的规则: ${passedRuleIds.join(", ")}`);
  }
  console.log(`\n结论: ${blockers} blocker / ${findings.length - blockers} warning——${blockers ? "不建议提审，先清 blocker" : "blocker 已清，warning 评估后可提审"}\n`);
}

export function renderJson(result) {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      root: result.root,
      blockers: result.blockers,
      passedRuleIds: result.passedRuleIds,
      findings: result.findings.map(({ ruleId, severity, name, file, detail, basis, fix }) => ({
        ruleId, severity, name, file, detail, basis, fix,
      })),
    },
    null,
    2
  );
}

export function renderMarkdown({ root, findings, passedRuleIds, blockers }) {
  const rows = findings
    .map((f) => `| ${SEV_MARK[f.severity]} ${f.severity} | ${f.ruleId} | ${f.name} | ${f.file} | ${f.detail} |`)
    .join("\n");
  return `# 提审合规门禁报告

- 扫描目录：\`${root}\`
- 时间：${new Date().toISOString()}
- 结论：**${blockers} blocker / ${findings.length - blockers} warning**

| 级别 | 规则 | 名称 | 位置 | 说明 |
|---|---|---|---|---|
${rows || "| — | — | 无违规 | — | — |"}

通过规则：${passedRuleIds.join(", ") || "无"}
`;
}
