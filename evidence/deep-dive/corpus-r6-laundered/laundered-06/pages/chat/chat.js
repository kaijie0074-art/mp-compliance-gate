Page({
  data: {
    messages: [],
    inputVal: ''
  },
  onInput: function(e) {
    this.setData({
      inputVal: e.detail.value
    });
  },
  submitQuestion: function() {
    const question = this.data.inputVal;
    if (question.trim() !== '') {
      this.addMessage(question, 'user');
      this.fetchResponse(question);
    }
    this.setData({
      inputVal: ''
    });
  },
  addMessage: function(text, type) {
    const message = { text: text, type: type };
    this.setData({
      messages: [...this.data.messages, message]
    });
  },
  fetchResponse: function(question) {
    // 模拟发送请求到服务器获取回答
    wx.request({
      url: '/q?question=' + question,
      method: 'GET',
      success: (res) => {
        this.addMessage(res.data.answer, 'ai');
      }
    });
  }
})