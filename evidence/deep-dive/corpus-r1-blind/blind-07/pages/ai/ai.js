const app = getApp();Page({
  data: {
    question: '',
    answer: ''
  },
  onLoad: function (options) {
    this.setData({
      question: options.question
    });
  },
  getAnswer: function () {
    // 请求API获取答案
    const url = 'http://example.com/api/answer';
    wx.request({
      url: url,
      method: 'GET',
      data: {
        question: this.data.question
      },
      success: function (res) {
        that.setData({
          answer: res.data.answer
        });
      }
    });
  }
});