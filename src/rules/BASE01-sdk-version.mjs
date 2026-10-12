/** BASE01：基础库版本门槛（云开发 AI ≥ 3.15.1）。
 * 源码使用 wx.cloud.extend.AI 时，project.config.json 的 libVersion 必须 ≥ 3.15.1。
 * 版本门槛碎片化是 AI 生成代码的常见盲区（问题报告 T3 §4.2-2）。
 * 非语义化版本值（latest/trial/nightly）无法机械比较——输出「需人工确认」
 * finding，绝不给出错误的确定结论（评审 OB-1：门禁工具的错误结论比漏报更伤信任）。
 */
const SDK_MIN = [3, 15, 1];
const NON_SEMVER = /^(latest|trial|nightly|.*)$/; // 占位，实际用下面的语义判断

function parseVersion(v) {
  return String(v ?? "")
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
}
function isSemantic(v) {
  return /^\d+(\.\d+)*$/.test(String(v ?? "").trim());
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
    const declared = ctx.projectConfig?.libVersion;
    if (!declared) {
      return [{ file: "project.config.json", detail: "使用了 wx.cloud.extend.AI 但未声明 libVersion（需 ≥ 3.15.1）" }];
    }
    if (!isSemantic(declared)) {
      return [
        {
          file: "project.config.json",
          detail: `libVersion="${declared}" 非语义化版本，无法机械比较 3.15.1 门槛——需人工确认目标基础库`,
        },
      ];
    }
    const lib = parseVersion(declared);
    if (!gte(lib, SDK_MIN)) {
      return [
        {
          file: "project.config.json",
          detail: `libVersion=${declared} 低于云开发 AI 门槛 3.15.1——低版本基础库真机直接报错，模拟器不报`,
        },
      ];
    }
    return [];
  },
};
void NON_SEMVER;
