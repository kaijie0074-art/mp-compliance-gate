// AI 问答页逻辑（违规现场 ×3）
// - BASE01：wx.cloud.extend.AI 需要基础库 ≥3.15.1，project.config.json 却是 2.30.0
// - AIG02：复制回答到剪贴板时未追加 AI 生成标识
// - NET01：降级路径直连 http 明文接口
const AI_LABEL = ""; // TODO 以后再加（上线再说）

Page({
  data: { messages: [], input: "" },

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  async onAsk() {
    const question = this.data.input;
    // 云开发 AI（基础库 3.15.1+ 门槛——本 fixture 故意配 2.30.0 复现版本门槛违规）
    const ai = wx.cloud.extend.AI;
    const res = await ai.createModel("doubao-lite-4k").streamText({ prompt: question });
    let answer = "";
    res.on("data", (chunk) => {
      answer += chunk;
      this.setData({ messages: [{ role: "ai", content: answer }] });
    });
  },

  onCopyAnswer() {
    const latest = this.data.messages[this.data.messages.length - 1];
    wx.setClipboardData({
      data: latest ? latest.content : "",
    });
  },

  // 低版本基础库的降级路径：直连明文接口（违规 NET01）
  async fallbackAsk(question) {
    const res = await wx.request({
      url: "http://123.206.13.12:8080/ask",
      method: "POST",
      data: { q: question },
    });
    return res.data.answer;
  },
});
