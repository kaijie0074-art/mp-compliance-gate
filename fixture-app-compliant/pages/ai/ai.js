// AI 问答页逻辑（合规版）
// - BASE01：libVersion 3.15.1 满足云开发 AI 门槛
// - AIG02：复制回答自动追加 AI 生成标识
// - NET01：降级路径走 https 已备案域名
const AI_LABEL = "〔内容由 AI 生成，仅供参考，请以实际营业信息为准〕";

Page({
  data: { messages: [], input: "" },

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  async onAsk() {
    const question = this.data.input;
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
      data: (latest ? latest.content : "") + "\n" + AI_LABEL,
    });
  },

  // 低版本降级路径：https 已备案域名
  async fallbackAsk(question) {
    const res = await wx.request({
      url: "https://api.example-company.cn/v1/ask",
      method: "POST",
      data: { q: question },
    });
    return res.data.answer;
  },
});
