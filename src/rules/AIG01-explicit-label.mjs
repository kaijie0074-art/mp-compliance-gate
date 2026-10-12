/** AIG01：AI 生成内容显式标识（交互界面）。
 * 扫描 WXML：含 AI 对话/生成结果的页面必须挂显著提示文案。
 * 检测启发式：页面 wxml 出现 ai-chat/ai-result/generate 等特征 class 或组件时，
 * 同文件必须包含「AI 生成」标识文案（《办法》第四条第一款路径）。
 */
const AI_PAGE_HINTS = /(ai-chat|ai-result|ai-stream|chat-answer|generate-?result|ai-?answer)/i;
const LABEL_HINTS = /(内容由\s*AI\s*生成|AI\s*生成，仅供|生成内容仅供参考|人工智能生成)/;

export default {
  id: "AIG01",
  check(ctx) {
    const findings = [];
    const wxmlFiles = ctx.files.filter((f) => f.endsWith(".wxml"));
    if (wxmlFiles.length === 0) {
      findings.push({ file: "(root)", detail: "未找到任何 WXML 页面，无法确认界面标识——纯后端项目请人工核对" });
      return findings;
    }
    for (const f of wxmlFiles) {
      const text = ctx.readText[f] ?? "";
      if (AI_PAGE_HINTS.test(text) && !LABEL_HINTS.test(text)) {
        findings.push({ file: rel(ctx, f), detail: "AI 生成结果界面缺少「内容由 AI 生成」显著提示" });
      }
    }
    return findings;
  },
};

function rel(ctx, f) {
  return f.startsWith(ctx.root) ? f.slice(ctx.root.length + 1) : f;
}
