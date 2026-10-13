/** AIG02：复制/导出路径必须保留生成标识。
 * 扫描 JS：每次 wx.setClipboardData 调用，其 data 表达式必须包含标识文案变量/字面量。
 *
 * 对抗研究 Q2 修补（2026-10-14）：
 * 1) 判定范围从「7 行窗口」收紧到「data 表达式本身」——窗口内任何位置出现标识变量
 *    （如 success 回调里的无关引用）都会造成假通过（诱饵绕过）；
 * 2) 标识字面量词表扩充：人工智能生成 / AI generated（知规对抗用变体措辞伪装成已标识）。
 */
const LABEL_VAR = /(AI_LABEL|AI_LABEL_TEXT|aiLabel|AI_NOTICE|LABEL_AI)/;
const LABEL_TEXT = /(内容由\s*AI\s*生成|AI\s*生成，仅供|生成内容仅供参考|人工智能生成|AI\s*generated)/i;

export default {
  id: "AIG02",
  check(ctx) {
    const findings = [];
    for (const f of ctx.files.filter((x) => x.endsWith(".js"))) {
      const text = ctx.readText[f] ?? "";
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (!line.includes("wx.setClipboardData")) return;
        // 向后看 6 行取 data 字段
        const window = lines.slice(i, i + 7).join("\n");
        const dataMatch = window.match(/data\s*:\s*([\s\S]{0,180})/);
        if (!dataMatch) {
          findings.push({
            file: rel(ctx, f),
            detail: `第 ${i + 1} 行 wx.setClipboardData 未在窗口内见到 data 表达式——需人工确认复制内容已追加 AI 生成标识`,
          });
          return;
        }
        // 截断到 data 表达式本身：砍掉 success/fail 回调里的无关内容
        const expr = dataMatch[1].split(/success\s*:|fail\s*:/)[0];
        if (!LABEL_VAR.test(expr) && !LABEL_TEXT.test(expr)) {
          findings.push({
            file: rel(ctx, f),
            detail: `第 ${i + 1} 行 wx.setClipboardData 的 data 表达式未追加 AI 生成标识（文案或标识变量均未检出；若为外部拼接的变量引用需人工确认）`,
          });
        }
      });
    }
    return findings;
  },
};

function rel(ctx, f) {
  return f.startsWith(ctx.root) ? f.slice(ctx.root.length + 1) : f;
}
