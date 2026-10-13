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
  onSend: function() {
    const question = this.data.question;
    wx.cloud.callFunction({
      name: 'aiChat',
      data: {
        question: question
      },
      success: res => {
        this.setData({
          response: res.result.text
        });
      },
      fail: err => {
        console.error('调用云函数失败', err);
      }
    });
  }
})