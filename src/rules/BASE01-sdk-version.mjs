/** BASE01：基础库版本门槛（云开发 AI ≥ 3.15.1）。
 * 源码使用 wx.cloud.extend.AI 时，project.config.json 的 libVersion 必须 ≥ 3.15.1。
 * 版本门槛碎片化是 AI 生成代码的常见盲区（问题报告 T3 §4.2-2）。
 */
const SDK_MIN = [3, 15, 1];

function parseVersion(v) {
  return String(v ?? "")
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
}
function gte(a, b) {
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return true;
}

export default {
  id: "BASE01",
  check(ctx) {
    const usesCloudAI = ctx.files.some((f) => f.endsWith(".js") && /wx\.cloud\.extend\.AI/.test(ctx.readText[f] ?? ""));
    if (!usesCloudAI) return [];
    const lib = parseVersion(ctx.projectConfig?.libVersion);
    if (!ctx.projectConfig?.libVersion) {
      return [{ file: "project.config.json", detail: "使用了 wx.cloud.extend.AI 但未声明 libVersion（需 ≥ 3.15.1）" }];
    }
    if (!gte(lib, SDK_MIN)) {
      return [
        {
          file: "project.config.json",
          detail: `libVersion=${ctx.projectConfig.libVersion} 低于云开发 AI 门槛 3.15.1——低版本基础库真机直接报错，模拟器不报`,
        },
      ];
    }
    return [];
  },
};
