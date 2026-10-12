/** 极简 YAML 子集解析器（零依赖）：支持本仓库两种文件的语法——
 * 嵌套 mapping、list-of-mapping、标量（含引号字符串与 # 注释剥离）。
 * 不支持锚点/多文档/流式集合——超出需要即换 js-yaml，不提前引依赖（YAGNI）。
 */
export function load(text) {
  const lines = text
    .split("\n")
    .map((l, i) => ({ raw: l, no: i + 1 }))
    .filter(({ raw }) => raw.trim() !== "" && !raw.trim().startsWith("#"));
  let pos = 0;

  function indentOf(s) {
    return s.length - s.trimStart().length;
  }
  function scalar(v) {
    v = v.trim();
    if (v.startsWith("[") || v.startsWith("{")) {
      throw new Error(`YAML 子集不支持流式集合: ${v.slice(0, 40)}`);
    }
    if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
    if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    if (v === "true" || v === "false") return v === "true";
    return v.replace(/\s+#.*$/, "").trim();
  }

  function parseBlock(indent) {
    if (pos >= lines.length) return null;
    const cur = lines[pos];
    if (indentOf(cur.raw) < indent) return null;
    const isList = cur.raw.trimStart().startsWith("- ");
    const out = isList ? [] : {};
    while (pos < lines.length) {
      const line = lines[pos];
      const ind = indentOf(line.raw);
      if (ind < indent) break;
      if (ind > indent) throw new Error(`YAML 缩进错误 第 ${line.no} 行`);
      const t = line.raw.trimStart();
      if (t.startsWith("- ")) {
        if (!isList) throw new Error(`YAML 混合结构 第 ${line.no} 行`);
        pos += 1;
        const rest = t.slice(2);
        if (/^[^:]+:(\s|$)/.test(rest)) {
          // 列表项是 mapping：把首键提出来，与后续更深缩进合并解析
          const firstIndent = ind + 2;
          const deeper = collectDeeper(firstIndent); // lines[pos..pos+len-1]
          const synthetic = [{ raw: " ".repeat(firstIndent) + rest, no: line.no }, ...deeper];
          // 用「首键行 + 原更深行」整体替换更深行区段，再按 mapping 块解析
          lines.splice(pos, deeper.length, ...synthetic);
          out.push(parseBlock(firstIndent));
        } else {
          out.push(scalar(rest));
        }
      } else {
        const m = t.match(/^([^:]+):(.*)$/);
        if (!m) throw new Error(`YAML 语法错误 第 ${line.no} 行: ${t}`);
        const key = m[1].trim();
        const val = m[2].trim();
        pos += 1;
        if (val === "") {
          out[key] = parseBlock(indent + 2);
        } else {
          out[key] = scalar(val);
        }
      }
    }
    return out;

    function collectDeeper(minIndent) {
      const grabbed = [];
      while (pos + 1 + grabbed.length < lines.length) {
        const nxt = lines[pos + grabbed.length];
        if (indentOf(nxt.raw) >= minIndent || nxt.raw.trim() === "") grabbed.push(nxt);
        else break;
      }
      return grabbed;
    }
  }

  const result = parseBlock(0);
  return result;
}
