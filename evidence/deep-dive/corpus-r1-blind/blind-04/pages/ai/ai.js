Page({
  onLoad: function() {
    this.init问答接口();
  },
  init问答接口: function() {
    // AI 问答接口明文 http 连接，真实情况下会被微信拒审
    var url = 'http://example.com/api';
    wx.request({
      url: url,
      success: function(res) {
        // 处理数据
      }
    });
  }
});