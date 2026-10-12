#!/usr/bin/env node
/** mp-compliance-gate CLI：node src/cli.mjs <小程序项目目录> [--json out.json] [--md out.md]
 * 退出码：0 = 全绿可提审；1 = 存在 blocker；2 = 参数/IO 错误。
 */
import { writeFile } from "node:fs/promises";
import { runGate } from "./engine.mjs";
import { renderConsole, renderMarkdown, renderJson } from "./report.mjs";

async function main() {
  const args = process.argv.slice(2);
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--json") flags.json = args[++i];
    else if (args[i] === "--md") flags.md = args[++i];
    else positional.push(args[i]);
  }
  const root = positional[0];
  if (!root) {
    console.error("用法: mp-compliance-gate <小程序项目目录> [--json out.json] [--md out.md]");
    process.exit(2);
  }
  const result = await runGate(root);
  renderConsole(result);
  if (flags.json) await writeFile(flags.json, renderJson(result), "utf8");
  if (flags.md) await writeFile(flags.md, renderMarkdown(result), "utf8");
  process.exit(result.blockers > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("gate 运行失败:", e.message);
  process.exit(2);
});
