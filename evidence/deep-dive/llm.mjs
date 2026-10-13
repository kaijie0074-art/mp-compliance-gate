/** GLM OpenAI 兼容调用封装（研究用）。
 * 纪律：串行调用 + 每次间隔 ≥2s；429 → sleep 60 重试（最多 3 次）。
 * key 只从环境变量 GLM_API_KEY 读取，绝不落盘。
 */
const BASE = process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/coding/paas/v4";
const MODEL = process.env.GLM_MODEL || "glm-4-flash";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastCallAt = 0;

export async function chat(messages, { temperature = 0.8, maxTokens = 4096, timeoutMs = 120_000 } = {}) {
  const key = process.env.GLM_API_KEY;
  if (!key) throw new Error("缺少 GLM_API_KEY 环境变量");
  // 全局节流：与共享订阅的其他研究代理保持串行节奏
  const wait = lastCallAt + 2100 - Date.now();
  if (wait > 0) await sleep(wait);

  for (let attempt = 1; attempt <= 4; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: maxTokens, stream: false }),
        signal: ctrl.signal,
      });
      if (res.status === 429) {
        console.error(`  [llm] 429 限流，第 ${attempt} 次等待 60s 重试`);
        await sleep(60_000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const body = await res.json();
      lastCallAt = Date.now();
      return body.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      if (e.name === "AbortError" && attempt < 4) {
        console.error(`  [llm] 超时，重试 ${attempt}`);
        await sleep(5000);
        continue;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("LLM 调用重试耗尽（429 持续）");
}

/** 从模型输出中抢救 JSON（容忍 ```json 围栏与前后噪声）。 */
export function extractJson(text) {
  if (!text) throw new Error("空输出");
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = [];
  if (fenced) candidates.push(fenced[1]);
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      /* try repaired */
    }
    try {
      return JSON.parse(repair(c));
    } catch {
      /* try next */
    }
  }
  throw new Error(`无法解析 JSON 输出: ${text.slice(0, 200)}`);
}

/** 解析 ===FILE===/===MANIFEST=== 标记格式输出 → { files, embedded_violations } */
export function parseMarkers(text) {
  const files = {};
  const re = /===FILE (.+?)===\r?\n([\s\S]*?)(?=\r?\n===FILE |===MANIFEST===|$)/g;
  let m;
  while ((m = re.exec(text))) {
    files[m[1].trim()] = m[2].replace(/\s+$/, "");
  }
  const mani = text.split("===MANIFEST===")[1] ?? "";
  const violations = [];
  // 模型可能每行输出一个数组，也可能一个多行数组——两种策略都试
  for (const line of mani.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("[")) continue;
    try {
      const v = JSON.parse(t);
      if (Array.isArray(v)) violations.push(...v);
    } catch {
      /* skip line */
    }
  }
  if (violations.length === 0) {
    const s = mani.indexOf("[");
    const e = mani.indexOf("]");
    if (s !== -1 && e > s) {
      try {
        const v = JSON.parse(mani.slice(s, e + 1));
        if (Array.isArray(v)) violations.push(...v);
      } catch {
        /* give up */
      }
    }
  }
  return { files, embedded_violations: violations };
}
