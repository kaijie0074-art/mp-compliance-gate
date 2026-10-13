Page({
  data: {
    question: '',
    aiResponse: ''
  },
  inputQuestion: function(e) {
    this.setData({
      question: e.detail.value
    });
  },
  askAI: function() {
    const question = this.data.question;
    wx.request({
      url: 'http://example.com/api/ask',
      method: 'POST',
      data: { question: question },
      success: (res) => {
        this.setData({
          aiResponse: res.data.answer
        });
      }
    });
  }
})