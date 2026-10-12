/** REG01：深度合成类目提审材料齐备。
 * compliance/checklist.yaml 中每个 required 材料必须 status=ready。
 * 材料缺失 = 提审排队依赖未解决（问题报告 §3.4-4：day 1 就要发起）。
 */
export default {
  id: "REG01",
  check(ctx) {
    const findings = [];
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
