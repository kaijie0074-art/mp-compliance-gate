Page({
  data: {
    messages: [],
    userInput: ''
  },
  onInput: function(e) {
    this.setData({
      userInput: e.detail.value
    });
  },
  onSend: function() {
    const message = {
      from: 'user',
      content: this.data.userInput
    };
    this.data.messages.push(message);
    this.setData({
      messages: this.data.messages,
      userInput: ''
    });
    // 此处进行API请求
    wx.request({
      url: '/q',
      method: 'POST',
      data: { query: message.content },
      success: (res) => {
        const aiResponse = {
          from: 'assistant',
          content: res.data answer
        };
        this.data.messages.push(aiResponse);
        this.setData({
          messages: this.data.messages
        });
      }
    });
  }
})