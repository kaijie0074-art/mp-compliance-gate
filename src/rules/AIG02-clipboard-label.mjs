/** AIG02：复制/导出路径必须保留生成标识。
 * 扫描 JS：每次 wx.setClipboardData 调用，其 data 表达式必须包含标识文案变量/字面量。
 */
const LABEL_VAR = /(AI_LABEL|AI_LABEL_TEXT|aiLabel|AI_NOTICE|LABEL_AI)/;
const LABEL_TEXT = /(内容由\s*AI\s*生成|AI\s*生成，仅供)/;

export default {
  id: "AIG02",
  check(ctx) {
    const findings = [];
    for (const f of ctx.files.filter((x) => x.endsWith(".js"))) {
      const text = ctx.readText[f] ?? "";
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (line.includes("wx.setClipboardData")) {
          // 向后看 6 行取 data 字段
          const window = lines.slice(i, i + 7).join("\n");
          const dataMatch = window.match(/data\s*:\s*(.{0,120})/s);
          if (!dataMatch) {
            findings.push({
              file: rel(ctx, f),
              detail: `第 ${i + 1} 行 wx.setClipboardData 未在窗口内见到 data 表达式——需人工确认复制内容已追加 AI 生成标识`,
            });
          } else if (!LABEL_VAR.test(window) && !LABEL_TEXT.test(window)) {
            findings.push({
              file: rel(ctx, f),
              detail: `第 ${i + 1} 行 wx.setClipboardData 的 data 未追加 AI 生成标识（文案或标识变量均未检出；若为外部拼接的变量引用需人工确认）`,
            });
          }
        }
      });
    }
    return findings;
  },
};

function rel(ctx, f) {
  return f.startsWith(ctx.root) ? f.slice(ctx.root.length + 1) : f;
}
