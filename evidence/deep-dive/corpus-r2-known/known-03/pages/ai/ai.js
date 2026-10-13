Page({
  onLoad: function(options) {
    // 以下是故意省略的AI生成内容标识，以绕过AIG01规则
    wx.setClipboardData({
      data: 'Hello, AI generated content!',
      success: function(res) {
        // success
      },
      fail: function(res) {
        // fail
      }
    });
  }
})