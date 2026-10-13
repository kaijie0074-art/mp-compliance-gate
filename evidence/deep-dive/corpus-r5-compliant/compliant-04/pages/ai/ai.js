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
    // 模拟发送问题到AI服务并返回结果
    const response = '这是一个AI生成的答案。';
    this.setData({
      response: response
    });
  }
})