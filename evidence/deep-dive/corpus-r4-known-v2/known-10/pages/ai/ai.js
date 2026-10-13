Page({
  data: {
    messages: [],
    inputVal: ''
  },
  onInput: function(event) {
    this.setData({
      inputVal: event.detail.value
    });
  },
  onSend: function() {
    if (this.data.inputVal.trim() !== '') {
      this.setData({
        messages: [...this.data.messages, { user: 'user', text: this.data.inputVal }],
        inputVal: ''
      });
      this.processInput();
    }
  },
  processInput: function() {
    // 模拟 AI 响应
    const response = '您好，我是AI助手，有什么可以帮助您的？';
    this.setData({
      messages: [...this.data.messages, { user: 'AI', text: response }]
    });
  }
})