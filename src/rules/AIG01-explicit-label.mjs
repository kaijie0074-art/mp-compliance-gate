/** AIG01：AI 生成内容显式标识（交互界面）。
 * 扫描 WXML：含 AI 对话/生成结果的页面必须挂显著提示文案。
 * 检测启发式：页面 wxml 出现 ai-chat/ai-result/generate 等特征 class 或组件时，
 * 同文件必须包含「AI 生成」标识文案（《办法》第四条第一款路径）。
 *
 * 对抗研究 Q1 修补（2026-10-14）：盲生成语料 11/11 用 generic class（answer/chat），
 * 词表召回 0%。新增结构判定：按 app.json pages 建页映射，
 * 「强信号（页面 js 调 AI API / wxml 特征 class）」或「双中信号（ai 路径 + AI 业务文案）」
 * 判定该页呈现 AI 生成内容 → 该页 wxml 必须含标识文案。
 * 结构判定为启发式，误报时人工复核（消息中明示）。
 */
const AI_PAGE_HINTS = /(ai-chat|ai-result|ai-stream|chat-answer|generate-?result|ai-?answer)/i;
const LABEL_HINTS = /(内容由\s*AI\s*生成|AI\s*生成，仅供|生成内容仅供参考|人工智能生成|AI\s*generated)/i;
const AI_API = /(wx\.cloud\.extend\.AI|createModel|streamText|chat\/completions|gpt-?[345o]|llm)/i;
const AI_TEXT = /(AI\s*(问答|助手|聊天|回答|客服|chat|assistant)|智能(问答|助手|客服)|大模型)/i;

export default {
  id: "AIG01",
  check(ctx) {
    const findings = [];
    const wxmlFiles = ctx.files.filter((f) => f.endsWith(".wxml"));
    if (wxmlFiles.length === 0) {
      findings.push({ file: "(root)", detail: "未找到任何 WXML 页面，无法确认界面标识——纯后端项目请人工核对" });
      return findings;
    }
    const flagged = new Set();
    for (const f of wxmlFiles) {
      const text = ctx.readText[f] ?? "";
      if (AI_PAGE_HINTS.test(text) && !LABEL_HINTS.test(text)) {
        findings.push({ file: rel(ctx, f), detail: "AI 生成结果界面缺少「内容由 AI 生成」显著提示" });
        flagged.add(f);
      }
    }

    // 结构判定前置条件：app.json 存在但 pages 异常（模型/人工写坏）→ 无法做页级判定，显式交人工
    if (ctx.appJson && !Array.isArray(ctx.appJson.pages)) {
      findings.push({
        file: "app.json",
        detail: "app.json 存在但 pages 字段非数组（结构异常）——无法做页面级 AI 标识判定，需人工确认",
      });
    }
    // 结构判定：app.json 页映射 + AI 信号（词表之外的召回兜底）
    const pages = Array.isArray(ctx.appJson?.pages) ? ctx.appJson.pages : [];
    const appText = JSON.stringify(ctx.appJson ?? {});
    for (const page of pages) {
      if (typeof page !== "string") continue;
      const jsText = ctx.readText[joinRoot(ctx, `${page}.js`)] ?? "";
      const wxmlPath = wxmlFiles.find((f) => f === joinRoot(ctx, `${page}.wxml`));
      const wxmlText = wxmlPath ? ctx.readText[wxmlPath] ?? "" : "";
      if (!wxmlPath) continue; // 无 wxml 的页面（纯组件页）不在本规则范围
      const strong = AI_API.test(jsText) || AI_PAGE_HINTS.test(wxmlText);
      const mediumPath = /(^|\/)ai(-|\/)/i.test(page) || /\/ai\//.test(page);
      const mediumText = AI_TEXT.test(jsText) || AI_TEXT.test(wxmlText) || AI_TEXT.test(appText);
      const isAiPage = strong || (mediumPath && mediumText);
      if (isAiPage && !LABEL_HINTS.test(wxmlText) && !flagged.has(wxmlPath)) {
        findings.push({
          file: rel(ctx, wxmlPath),
          detail: `结构判定：页面 ${page} 呈现 AI 生成内容（AI API/业务文案信号）但界面未见「内容由 AI 生成」显著提示——启发式判定，误报请人工复核`,
        });
        flagged.add(wxmlPath);
      }
    }
    return findings;
  },
};

function rel(ctx, f) {
  return f.startsWith(ctx.root) ? f.slice(ctx.root.length + 1) : f;
}
function joinRoot(ctx, relPath) {
  // readText 的键是 walk 产生的绝对/相对路径；兼容两种 root 形态
  const cand = `${ctx.root}/${relPath}`;
  return ctx.readText[cand] !== undefined ? cand : relPath;
}
