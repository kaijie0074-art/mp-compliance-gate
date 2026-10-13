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
  onQuery: function() {
    // 模拟AI问答逻辑
    const question = this.data.question;
    this.setData({
      response: `AI回答：${question}`
    });
  }
})