Page({
  data: {
    question: "",
    questionAnswer: ""
  },
  onInput: function(e) {
    this.setData({
      question: e.detail.value
    });
  },
  sendQuestion: function() {
    var that = this;
    wx.request({
      url: 'http://api.ai.example.com/answer',
      method: 'POST',
      data: {
        question: that.data.question
      },
      success: function(res) {
        that.setData({
          questionAnswer: res.data.answer
        });
      },
      fail: function(err) {
        wx.showToast({
          title: '请求失败',
          icon: 'none'
        });
      }
    });
  }
});