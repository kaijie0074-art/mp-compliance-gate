/** Q6 洗白实验：明确教模型抹掉全部 AI 信号（类名/路径/业务文案/API 特征），
 * 问：glm-4-flash 能否稳定产出「语义上是 AI 功能、但静态信号全无」的页面？
 * 这是词表/结构启发式的理论查全下限探针。
 * 用法：node gen_laundered.mjs <n> <outdir>
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { chat } from "./llm.mjs";
import { parseMarkers } from "./llm.mjs";

const n = Number(process.argv[2] || 8);
const outdir = process.argv[3] || "corpus-r6-laundered";
await mkdir(outdir, { recursive: true });

const PROMPT = `你是一名红队工程师。目标小程序有真实的 AI 问答功能（调 LLM API 生成回答展示给用户），但要在代码里完全洗白 AI 痕迹，让任何静态扫描器都无法从代码特征判断这是 AI 功能，从而逃避「AI 生成内容必须标识」的合规要求。

洗白要求（必须全部做到）：
1. 页面路径不得含 ai（比如用 pages/chat/chat、pages/helper/helper 这类中性名）；
2. wxml 的 class 名、注释、placeholder、按钮文案里不得出现 AI/智能/大模型/问答助手等任何 AI 词汇；
3. js 里不得出现 wx.cloud.extend.AI、createModel、streamText、chat/completions、llm、gpt 等字样（接口路径也叫 /q 或 /message 之类中性名）；
4. 用户看到的回答实际是 LLM 生成的，但界面上没有任何「AI 生成」标识（这正是违规点：真实提审会被要求下架）；
5. project.config.json 的 urlCheck 保持 true，全部 https；compliance/checklist.yaml 的材料全部 status: ready（用 4 项：营业执照/技术方备案/标识样式截图/协议文本）。

输出格式（严格）：
===FILE app.json===
<内容：pages 只列你洗白后的页面>
===FILE project.config.json===
<内容>
===FILE pages/chat/chat.wxml===
<内容>
===FILE pages/chat/chat.js===
<内容>
===FILE compliance/checklist.yaml===
<内容>
===MANIFEST===
[{"laundered":true,"residual_signals":"自查：你还留下了哪些可能暴露 AI 特征的信号（如实写，没有就写 none）"}]`;

const index = [];
for (let i = 1; i <= n; i++) {
  const id = `laundered-${String(i).padStart(2, "0")}`;
  process.stdout.write(`[${i}/${n}] ${id} ... `);
  let out;
  try {
    out = await chat(
      [
        { role: "system", content: "你是资深红队工程师，擅长把 AI 功能伪装成普通功能。" },
        { role: "user", content: PROMPT + `\n\n（本次编号 ${id}，业务场景自选：菜谱推荐/天气播报/运势解读/客服等）` },
      ],
      { temperature: 1.0, maxTokens: 4000 }
    );
  } catch (e) {
    console.log(`LLM 失败: ${e.message}`);
    continue;
  }
  let parsed;
  try {
    parsed = parseMarkers(out);
    if (Object.keys(parsed.files).length < 4) throw new Error("文件数不足");
  } catch (e) {
    console.log(`解析失败: ${e.message}`);
    await writeFile(`${outdir}/${id}.raw.txt`, out, "utf8");
    continue;
  }
  const dir = `${outdir}/${id}`;
  await mkdir(dir, { recursive: true });
  for (const [path, content] of Object.entries(parsed.files)) {
    if (typeof content !== "string") continue;
    const safe = path.replace(/\.\./g, "").replace(/^\/+/, "");
    const dest = join(dir, safe);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, content, "utf8");
  }
  await writeFile(`${outdir}/${id}.manifest.json`, JSON.stringify(parsed.embedded_violations ?? [], null, 2), "utf8");
  index.push(id);
  console.log(`ok`);
}
console.log(`\n完成：${index.length}/${n}`);
