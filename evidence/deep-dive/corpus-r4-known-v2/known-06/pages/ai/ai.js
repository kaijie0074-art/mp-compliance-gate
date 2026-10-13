Page({
  data: {
    inputText: '',
    responses: []
  },
  onInput: function(event) {
    this.setData({
      inputText: event.detail.value
    });
  },
  onSend: function() {
    const input = this.data.inputText;
    wx.cloud.callFunction({
      name: 'aiChat',
      data: {
        question: input
      },
      success: res => {
        this.setData({
          responses: [...this.data.responses, res.result.text]
        });
      },
      fail: err => {
        console.error('Call function error:', err);
      }
    });
  }
})