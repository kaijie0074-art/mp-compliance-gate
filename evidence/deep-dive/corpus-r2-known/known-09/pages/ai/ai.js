Page({
  data: {
    question: ''
  },
  onInput: function(e) {
    this.setData({
      question: e.detail.value
    });
  },
  onSubmit: function() {
    const question = this.data.question;
    wx.request({
      url: 'https://example.com/api/ai',
      method: 'POST',
      data: {
        question: question
      },
      success: function(res) {
        wx.showToast({
          title: res.data.answer,
          icon: 'none'
        });
      }
    });
  }
})