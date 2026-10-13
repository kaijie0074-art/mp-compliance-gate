/** REG01：深度合成类目提审材料齐备。
 * compliance/checklist.yaml 中每个 required 材料必须 status=ready。
 * 材料缺失 = 提审排队依赖未解决（问题报告 §3.4-4：day 1 就要发起）。
 *
 * 对抗研究 Q2 修补（2026-10-14）：知规对抗样本把全部 status 伪造为 ready（语义层无法机械识破，
 * 属规则固有上限），但当时的「拦截」其实来自 yaml-lite 解析失败被误报成"缺少清单文件"——
 * 文件存在却解析失败必须与文件缺失区分开，否则消息误导人工排查。
 */
// 「就绪」状态词表（对抗研究 Q5：合规意图样本写 Checked/Completed/passed/已就绪 等变体，
const READY = /^(ready|complete[d]?|compliant|checked|reviewed|passed|done|ok|已就绪|已完备|已准备|已合规)$/i;

export default {
  id: "REG01",
  check(ctx) {
    const findings = [];
    if (ctx.checklistError) {
      return [{ file: "compliance/checklist.yaml", detail: `${ctx.checklistError}——材料齐备性无法机械确认，需人工核对` }];
    }
    let materials = null;
    if (ctx.checklist && Array.isArray(ctx.checklist.materials)) materials = ctx.checklist.materials;
    else if (ctx.checklist && Array.isArray(ctx.checklist.items)) materials = ctx.checklist.items; // Q6 语料变体
    else if (Array.isArray(ctx.checklist)) materials = ctx.checklist; // Q6 语料变体：顶层数组
    if (!materials) {
      return [
        {
          file: "compliance/checklist.yaml",
          detail: ctx.checklist
            ? "清单文件结构不符合约定（需 materials: 列表，每项 id/name/status）——材料齐备性无法机械确认，需人工核对"
            : "缺少提审材料清单文件（深度合成类目材料无人跟踪）",
        },
      ];
    }
    for (const m of materials) {
      if (m.required !== false && !READY.test(String(m.status ?? ""))) {
        findings.push({
          file: "compliance/checklist.yaml",
          detail: `材料未就绪：${m.name}（id=${m.id}, status=${m.status ?? "missing"}）`,
        });
      }
    }
    return findings;
  },
};
