/** yaml-lite 单元测试：本仓库两种 YAML 形态的解析正确性。 */
import test from "node:test";
import assert from "node:assert/strict";
import { load } from "../src/yaml-lite.mjs";

test("list-of-mapping 首键不丢失（回归：id 字段曾被吃掉）", () => {
  const doc = load(`
rules:
  - id: AIG01
    name: 显式标识
    severity: blocker
  - id: NET01
    name: 域名
    severity: blocker
`);
  assert.equal(doc.rules[0].id, "AIG01");
  assert.equal(doc.rules[0].name, "显式标识");
  assert.equal(doc.rules[1].id, "NET01");
});

test("标量类型：数字 / 布尔 / 引号字符串 / 行内注释", () => {
  const doc = load(`
a: 42
b: true
c: "带: 冒号的值"
d: 普通值  # 行内注释应被剥离
`);
  assert.equal(doc.a, 42);
  assert.equal(doc.b, true);
  assert.equal(doc.c, "带: 冒号的值");
  assert.equal(doc.d, "普通值");
});

test("checklist 形态（status 值区分 pending/ready/missing）", () => {
  const doc = load(`
materials:
  - id: license
    name: 营业执照
    status: ready
  - id: filing
    name: 备案证明
    status: pending
`);
  assert.equal(doc.materials.length, 2);
  assert.equal(doc.materials[0].status, "ready");
  assert.equal(doc.materials[1].status, "pending");
});
