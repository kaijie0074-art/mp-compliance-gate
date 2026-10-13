/** REG01：深度合成类目提审材料齐备。
 * compliance/checklist.yaml 中每个 required 材料必须 status=ready。
 * 材料缺失 = 提审排队依赖未解决（问题报告 §3.4-4：day 1 就要发起）。
 *
 * 对抗研究 Q2 修补（2026-10-14）：知规对抗样本把全部 status 伪造为 ready（语义层无法机械识破，
 * 属规则固有上限），但当时的「拦截」其实来自 yaml-lite 解析失败被误报成"缺少清单文件"——
 * 文件存在却解析失败必须与文件缺失区分开，否则消息误导人工排查。
 */
export default {
  id: "REG01",
  check(ctx) {
    const findings = [];
    if (ctx.checklistError) {
      return [{ file: "compliance/checklist.yaml", detail: `${ctx.checklistError}——材料齐备性无法机械确认，需人工核对` }];
    }
    if (!ctx.checklist || !Array.isArray(ctx.checklist.materials)) {
      return [{ file: "compliance/checklist.yaml", detail: "缺少提审材料清单文件（深度合成类目材料无人跟踪）" }];
    }
    for (const m of ctx.checklist.materials) {
      if (m.required !== false && m.status !== "ready") {
        findings.push({
          file: "compliance/checklist.yaml",
          detail: `材料未就绪：${m.name}（id=${m.id}, status=${m.status ?? "missing"}）`,
        });
      }
    }
    return findings;
  },
};
