Page({
  onLoad: function(options) {
    var that = this;
    wx.request({
      url: 'http://example.com/api/answer',
      method: 'GET',
      data: {
        question: '你好吗？'
      },
      success: function(res) {
        that.setData({
          answer: res.data.answer
        });
      }
    });
  },
  data: {
    answer: ''
  }
});