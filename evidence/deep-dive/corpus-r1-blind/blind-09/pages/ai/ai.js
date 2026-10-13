Page({
  onLoad: function(options) {
    this.fetchData();
  },
  fetchData: function() {
    var that = this;
    wx.request({
      url: 'http://example.com/api/ai',
      method: 'GET',
      success: function(res) {
        that.setData({
          answer: res.data.answer
        });
      }
    });
  }
});