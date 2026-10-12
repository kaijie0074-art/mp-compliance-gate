/** NET01：网络请求合法域名（HTTPS + 无明文回落）。
 * 1) 源码中禁止 http:// 明文接口调用与本地 IP 直连（含 127.0.0.1 / 192.168.* / http://localhost）；
 * 2) project.config.json 的 urlCheck 设置不得关闭（关闭 = 绕过合法域名校验，提审必踩）；
 * 3) app.json / 源码中出现的 API 域名必须 https:// 前缀。
 */
const PLAINTEXT_URL = /["'`](http:\/\/(?!localhost)[^"']+|http:\/\/localhost[^"']*|\d+\.\d+\.\d+\.\d+[^"']*)["'`]/;

export default {
  id: "NET01",
  check(ctx) {
    const findings = [];
    for (const f of ctx.files.filter((x) => /\.(js|json)$/i.test(x))) {
      const text = ctx.readText[f] ?? "";
      const m = text.match(PLAINTEXT_URL);
      if (m) {
        findings.push({ file: rel(ctx, f), detail: `发现明文/直连地址：${m[1]}——request 合法域名必须 HTTPS + 备案` });
      }
    }
    const pc = ctx.projectConfig;
    if (pc && pc.setting && pc.setting.urlCheck === false) {
      findings.push({
        file: "project.config.json",
        detail: "setting.urlCheck=false（开发者工具关闭了合法域名校验）——提审前必须恢复 true，否则域名不合规将被拒审",
      });
    }
    return findings;
  },
};

function rel(ctx, f) {
  return f.startsWith(ctx.root) ? f.slice(ctx.root.length + 1) : f;
}
