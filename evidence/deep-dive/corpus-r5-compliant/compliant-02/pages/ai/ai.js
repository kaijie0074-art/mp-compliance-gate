Page({
  data: {
    question: '',
    aiResponse: ''
  },
  onInput: function(e) {
    this.setData({
      question: e.detail.value
    });
  },
  onAsk: function() {
    // AI问答逻辑
    this.setData({
      aiResponse: '正在生成回答...'
    });
    // 模拟AI生成回答
    setTimeout(() => {
      this.setData({
        aiResponse: 'AI回答：' + this.data.question
      });
    }, 1000);
  }
})