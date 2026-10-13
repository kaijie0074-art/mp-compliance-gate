Page({
  data: {
    question: '',
    response: ''
  },
  onInput: function(event) {
    this.setData({
      question: event.detail.value
    });
  },
  onAsk: function() {
    const question = this.data.question;
    if (question) {
      // 模拟AI问答逻辑
      this.setData({
        response: `AI回答：${question} 的答案是...`
      });
    }
  }
})