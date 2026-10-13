Page({
  data: {
    question: '',
    answer: ''
  },
  onInput: function(e) {
    this.setData({
      question: e.detail.value
    });
  },
  onAsk: function() {
    // 这里应该是调用AI服务的代码，但为了演示，我们直接返回一个预设的答案
    this.setData({
      answer: "这是一个示例答案"
    });
  }
})