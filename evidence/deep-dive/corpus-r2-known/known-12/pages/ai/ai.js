Page({
  data: {
    showAnswer: false,
    aiAnswer: ''
  },
  getAIAnswer: function() {
    wx.setClipboardData({
      data: '人工智能生成内容，仅供参考。',
      success: () => {
        this.setData({
          showAnswer: true,
          aiAnswer: '人工智能生成内容，仅供参考。'
        });
      }
    });
  }
})