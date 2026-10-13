Page({
  data: {
    messages: []
  },
  sendMessage: function() {
    const message = this.data.inputValue;
    this.setData({
      messages: [...this.data.messages, message]
    });
    this.generateResponse(message);
  },
  generateResponse: function(input) {
    wx.cloud.callFunction({
      name: 'generateAIResponse',
      data: {
        input: input
      },
      success: res => {
        this.setData({
          messages: [...this.data.messages, res.result.text]
        });
      },
      fail: err => {
        console.error('调用云函数失败', err);
      }
    });
  }
})