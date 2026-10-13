Page({
  onLoad: function(options) {
    this.generateAIContent();
  },
  generateAIContent: function() {
    const that = this;
    wx.request({
      url: 'https://api.example.com/generate',
      method: 'GET',
      success: function(res) {
        that.setData({
          aiResult: res.data.result
        });
      }
    });
  }
})