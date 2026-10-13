Page({
  data: {
    question: '',
    aiResult: ''
  },
  onInput: function(event) {
    this.setData({
      question: event.detail.value
    });
  },
  onSubmit: function() {
    const question = this.data.question;
    wx.cloud.callFunction({
      name: 'ai',
      data: { question: question },
      success: res => {
        this.setData({
          aiResult: res.result.text
        });
      },
      fail: err => {
        console.error('调用云函数失败', err);
      }
    });
  }
})