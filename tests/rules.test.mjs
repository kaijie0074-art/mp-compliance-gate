/** 规则单元测试（评审驱动）：BASE01 非语义化版本、AIG02 边界、yaml-lite 越界防护。 */
import test from "node:test";
import assert from "node:assert/strict";
import base01 from "../src/rules/BASE01-sdk-version.mjs";
import aig02 from "../src/rules/AIG02-clipboard-label.mjs";
import { load } from "../src/yaml-lite.mjs";

const CLOUD_AI_JS = "const ai = wx.cloud.extend.AI; void ai;";

function ctxWith({ libVersion, js = CLOUD_AI_JS }) {
  return {
    files: ["/x/pages/index/index.js"],
    readText: { "/x/pages/index/index.js": js },
    projectConfig: libVersion === undefined ? {} : { libVersion },
  };
}

test("BASE01：libVersion=latest 非语义化 → 报「需人工确认」而非错误结论（评审 OB-1）", () => {
  const findings = base01.check(ctxWith({ libVersion: "latest" }));
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /无法机械比较/);
  assert.match(findings[0].detail, /人工确认/);
});

test("BASE01：libVersion=trial 同样走人工确认分支", () => {
  const findings = base01.check(ctxWith({ libVersion: "trial" }));
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /人工确认/);
});

test("BASE01：语义化版本正常比较（3.15.1 过 / 3.14.9 拦 / 3.16.0 过）", () => {
  assert.equal(base01.check(ctxWith({ libVersion: "3.15.1" })).length, 0);
  assert.equal(base01.check(ctxWith({ libVersion: "3.16.0" })).length, 0);
  const bad = base01.check(ctxWith({ libVersion: "3.14.9" }));
  assert.equal(bad.length, 1);
  assert.match(bad[0].detail, /低于云开发 AI 门槛/);
});

test("BASE01：未使用云开发 AI 时不检查（不误报）", () => {
  const ctx = ctxWith({ libVersion: "2.20.0", js: "Page({});" });
  assert.equal(base01.check(ctx).length, 0);
});

test("AIG02：setClipboardData 的 data 为纯变量引用时提示人工确认（评审 OB-2）", () => {
  const ctx = {
    files: ["/x/copy.js"],
    readText: {
      "/x/copy.js": "Page({\n  onCopy() {\n    wx.setClipboardData({\n      data: this.decorated,\n    });\n  },\n});\n",
    },
  };
  const findings = aig02.check(ctx);
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /人工确认/);
});

test("AIG02：data 内联标识变量不误报", () => {
  const ctx = {
    files: ["/x/copy.js"],
    readText: {
      "/x/copy.js": "const AI_LABEL = '内容由 AI 生成';\nwx.setClipboardData({\n  data: text + AI_LABEL,\n});\n",
    },
  };
  assert.equal(aig02.check(ctx).length, 0);
});

test("yaml-lite：越界语法必须 fail loudly，不得静默吞错（评审 OB-3 防线证明）", () => {
  assert.throws(() => load("a: [1, 2, 3]"), undefined, "流式集合超出子集应抛错或按字符串处理");
  assert.throws(() => load("top:\n    over: indent\n  bad: mix"), /缩进|语法|YAML/);
});
